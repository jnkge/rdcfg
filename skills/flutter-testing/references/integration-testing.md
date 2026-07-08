# Integration Testing in Flutter

Integration tests run the **real app** on a device or emulator (or desktop/web
target) and exercise complete user flows end-to-end. They are slower and more
expensive than unit or widget tests, so they should cover critical user journeys,
not every branch.

The official package is
[`integration_test`](https://docs.flutter.dev/testing/integration-tests), bundled
with the Flutter SDK.

## Setup

Integration tests live in a top-level `integration_test/` directory (sibling of
`test/`, `lib/`):

```
my_app/
├── lib/
├── test/              # unit + widget tests
└── integration_test/  # integration tests
    └── app_test.dart
```

Add the dependency (usually already present via the Flutter SDK):

```yaml
# pubspec.yaml
dev_dependencies:
  integration_test:
    sdk: flutter
```

## Anatomy of an integration test

```dart
// integration_test/app_test.dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:my_app/main.dart' as app;

void main() {
  // Bind once for the entire suite — this connects the test harness
  // to the platform.
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Login flow', () {
    testWidgets('user can log in and see home screen', (tester) async {
      // 1. Start the real app
      app.main();
      await tester.pumpAndSettle();  // wait for first frame / splash

      // 2. Act: fill in credentials and tap login
      await tester.enterText(
        find.byKey(const Key('email-field')),
        'user@example.com',
      );
      await tester.enterText(
        find.byKey(const Key('password-field')),
        'password123',
      );
      await tester.tap(find.byKey(const Key('login-button')));
      await tester.pumpAndSettle();

      // 3. Assert: home screen is visible
      expect(find.text('Welcome, user@example.com'), findsOneWidget);
    });
  });
}
```

Key differences from widget tests:

- `IntegrationTestWidgetsFlutterBinding.ensureInitialized()` replaces the default
  test binding — it bridges to the platform's instrumentation.
- You start the app with `app.main()` instead of `pumpWidget`, because the real
  app has providers, routes, and side effects that `pumpWidget` can't set up.
- Interactions (`tap`, `enterText`, `drag`) use the same Finder API as widget
  tests, but they drive real platform input events.

## Running integration tests

### On a connected device / emulator

```bash
# Requires a running device (adb devices / flutter devices)
flutter test integration_test/app_test.dart
```

### On a desktop target (macOS / Linux / Windows)

```bash
flutter test integration_test/app_test.dart -d macos
```

### On Chrome (web)

```bash
flutter test integration_test/app_test.dart -d chrome
```

### All integration tests at once

```bash
flutter test integration_test/
```

## Screenshot tests

The integration binding can capture screenshots of the running app, which you
then compare against golden files — useful for verifying full-screen layouts on
real render pipelines.

```dart
testWidgets('home screen matches golden', (tester) async {
  app.main();
  await tester.pumpAndSettle();

  await tester.tap(find.byKey(const Key('login-button')));
  await tester.pumpAndSettle();

  // Capture a screenshot and compare to a golden image
  await binding.takeScreenshot('home_screen');
  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('goldens/home_screen.png'),
  );
});
```

Generate baselines the same way as widget goldens:

```bash
flutter test integration_test/ --update-goldens
```

## Reusable interaction helpers

Extract repeated flows into helpers to keep tests readable and maintainable:

```dart
class AppRobot {
  final WidgetTester tester;
  AppRobot(this.tester);

  Future<void> login({String email = 'test@example.com'}) async {
    await tester.enterText(
      find.byKey(const Key('email-field')),
      email,
    );
    await tester.enterText(
      find.byKey(const Key('password-field')),
      'password',
    );
    await tester.tap(find.byKey(const Key('login-button')));
    await tester.pumpAndSettle();
  }

  Future<void> openSettings() async {
    await tester.tap(find.byIcon(Icons.settings));
    await tester.pumpAndSettle();
  }

  Future<void> addToCart(String productName) async {
    await tester.scrollUntilVisible(
      find.text(productName),
      200,
    );
    await tester.pumpAndSettle();
    await tester.tap(
      find.descendant(
        of: find.ancestor(of: find.text(productName), matching: find.byType(Card)),
        matching: find.byIcon(Icons.add_shopping_cart),
      ),
    );
    await tester.pumpAndSettle();
  }
}

// Usage in a test
testWidgets('add to cart flow', (tester) async {
  app.main();
  await tester.pumpAndSettle();
  final robot = AppRobot(tester);
  await robot.login();
  await robot.addToCart('Coffee Mug');
  expect(find.text('1 item in cart'), findsOneWidget);
});
```

## CI integration

### GitHub Actions (Linux + Android emulator)

```yaml
# .github/workflows/integration_test.yml
name: Integration Tests
on: [push, pull_request]

jobs:
  integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get

      # Boot an Android emulator
      - name: AVD
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 33
          script: flutter test integration_test/

      # Upload screenshots / goldens on failure
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: integration-screenshots
          path: integration_test/goldens/
```

### Codemagic

Codemagic has first-class Flutter support — integration tests run as part of
the default pipeline. Configure the test script in `codemagic.yaml`:

```yaml
scripts:
  - name: Integration tests
    script: |
      flutter test integration_test/ --device-id "emulator"
```

### Best practice: separate fast and slow CI gates

Run **unit + widget tests** on every push (seconds), and **integration tests**
on a nightly schedule or pre-merge gate for release branches (minutes). This
keeps the PR feedback loop fast while still catching regressions.

```yaml
# Fast gate — every push
- run: flutter test  # unit + widget

# Slow gate — nightly or on main
on:
  schedule:
    - cron: '0 2 * * *'
- run: flutter test integration_test/
```

## Common pitfalls

**Pitfall: `app.main()` not awaited properly.**
`main()` launches the app asynchronously. Always `await tester.pumpAndSettle()`
after calling it so the first frame and any splash screen / async providers
finish before you interact.

**Pitfall: Network calls hit real servers.**
Integration tests run against the real environment unless you mock at the
network layer. Use a staging backend, or intercept with `http_mock_adapter`
/ `dio` interceptors configured in `main()` via an environment flag.

**Pitfall: Flaky tests from timing.**
Real animations and platform channels take variable time. Always use
`pumpAndSettle()` or `waitFor(find.byKey(...))` with a timeout instead of
`sleep` / `Future.delayed`.

**Pitfall: Only testing on one platform.**
Touch targets, scroll physics, and platform channels differ between iOS and
Android. Run critical flows on **both** platforms in CI.
