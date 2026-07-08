# Widget Testing in Flutter

Widget tests (sometimes called "component tests") verify that a single widget
renders correctly and responds to user interaction. They run in a lightweight
test environment — no real device, no full app — but the widget tree is
genuinely rendered via `flutter_test`.

## The `testWidgets` harness

```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:my_app/src/widgets/counter_widget.dart';

void main() {
  group('CounterWidget', () {
    testWidgets('displays initial count', (tester) async {
      // Arrange + Act: pump the widget into the test tree
      await tester.pumpWidget(
        MaterialApp(home: CounterWidget(initialValue: 5)),
      );

      // Assert: find the Text widget showing '5'
      expect(find.text('5'), findsOneWidget);
    });

    testWidgets('increments on tap', (tester) async {
      await tester.pumpWidget(
        MaterialApp(home: CounterWidget(initialValue: 0)),
      );

      // Verify initial state
      expect(find.text('0'), findsOneWidget);

      // Simulate tap
      await tester.tap(find.byIcon(Icons.add));

      // Rebuild after the setState / animation
      await tester.pumpAndSettle();

      // Verify updated state
      expect(find.text('1'), findsOneWidget);
    });
  });
}
```

## `WidgetTester` API

The `tester` object drives the widget lifecycle and interaction.

| Method | Purpose |
|--------|---------|
| `pumpWidget(widget)` | Mount a widget tree (wraps in a `RenderObject` tree) |
| `pump([duration])` | Trigger a single frame; optionally advance the clock |
| `pumpAndSettle([timeout])` | Pump frames until no more frames are scheduled (animations finish) |
| `tap(finder)` | Simulate a tap at the finder's center |
| `enterText(finder, text)` | Enter text into an EditableText |
| `drag(finder, offset)` | Drag by a given offset |
| `fling(finder, offset, duration)` | A fast drag (fling gesture) |
| `longPress(finder)` | Long press |
| `ensureVisible(finder)` | Scroll until the widget is visible |
| `binding` | Access the `TestWidgetsFlutterBinding` (time control, etc.) |

### `pump` vs `pumpAndSettle`

This is the single most important distinction and the source of most flaky
widget tests.

```dart
// pump — ONE frame. Use when you know exactly one rebuild is needed
// (e.g., right after setState with no animation).
await tester.pump();

// pump(Duration) — advance the virtual clock and pump frames in that window
await tester.pump(const Duration(milliseconds: 100));

// pumpAndSettle — pump frames repeatedly until the scheduler is idle.
// Use whenever an animation, Hero transition, or async setState is in flight.
await tester.pumpAndSettle();

// pumpAndSettle with a timeout (default 10s, raises if exceeded)
await tester.pumpAndSettle(const Duration(seconds: 2));
```

**Rule of thumb:** After any interaction that triggers `setState`, an animation,
or an async callback, call `pumpAndSettle()` before asserting. A bare `pump()`
immediately after a tap will often miss the rebuild.

## Finders

Finders locate widgets in the tree so you can assert or interact with them.

```dart
// By type
find.byType(Text);
find.byType(IconButton);

// By Key (use for widgets that repeat, like list items)
find.byKey(const ValueKey('submit-button'));

// By text
find.text('Submit');
find.textContaining('Load');

// By icon
find.byIcon(Icons.search);

// By widget-specific helpers
find.widgetWithIcon(AppBar, Icons.menu);
find.widgetWithText(Card, 'Title');

// Descendant / ancestor (tree navigation)
find.descendant(of: find.byType(ListTile), matching: find.byType(Text));
find.ancestor(of: find.text('Item'), matching: find.byType(Card));
```

### Finder assertion shortcuts

```dart
// Instead of expect(finder.evaluate(), hasLength(1)):
expect(find.text('Hello'), findsOneWidget);     // exactly one
expect(find.text('Hello'), findsNWidgets(3));   // exactly three
expect(find.text('Missing'), findsNothing);      // zero
expect(find.byType(Text), findsWidgets);         // one or more
```

## Interaction examples

### Tapping a button

```dart
testWidgets('submits form on button press', (tester) async {
  var submitted = false;
  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: ElevatedButton(
          onPressed: () => submitted = true,
          child: const Text('Submit'),
        ),
      ),
    ),
  );

  await tester.tap(find.text('Submit'));
  await tester.pumpAndSettle();

  expect(submitted, isTrue);
});
```

### Entering text

```dart
testWidgets('updates label as user types', (tester) async {
  await tester.pumpWidget(
    const MaterialApp(home: Scaffold(body: NameForm())),
  );

  await tester.enterText(find.byKey(const Key('name-field')), 'Alice');
  await tester.pumpAndSettle();

  expect(find.text('Hello, Alice'), findsOneWidget);
});
```

### Scrolling and tapping an off-screen item

```dart
testWidgets('taps the 50th list item', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: Scaffold(body: LongList(itemCount: 100))),
  );

  final item = find.text('Item 49');
  await tester.ensureVisible(item);   // scrolls it into view
  await tester.pumpAndSettle();
  await tester.tap(item);
  await tester.pumpAndSettle();
});
```

### Dragging (dismiss, reorder)

```dart
testWidgets('dismisses item on horizontal drag', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: Scaffold(body: DismissibleItem())),
  );

  await tester.drag(find.byType(Dismissible), const Offset(-500, 0));
  await tester.pumpAndSettle();

  expect(find.byType(Dismissible), findsNothing);
});
```

## Golden (snapshot) tests

Golden tests compare a rendered widget against a reference image file to catch
visual regressions.

```dart
testWidgets('CounterWidget looks correct', (tester) async {
  await tester.pumpWidget(
    MaterialApp(home: CounterWidget(initialValue: 42)),
  );

  // Compare rendered output to the golden image
  await expectLater(
    find.byType(CounterWidget),
    matchesGoldenFile('goldens/counter.png'),
  );
});
```

### Generating and updating goldens

```bash
# First run: generate the baseline images
flutter test --update-goldens

# Subsequent runs: compare against baseline
flutter test
```

Golden files are saved under `test/.../goldens/` and **must be committed to git**.

### Handling font / platform differences

Different platforms render text slightly differently (font hinting, anti-aliasing).
To make goldens deterministic across platforms, load a fixed font in
`setUp`:

```dart
import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_test/flutter_test.dart';

Future<void> loadTestFont() async {
  final fontData = await rootBundle.load('assets/fonts/Roboto-Regular.ttf');
  final bytes = fontData.buffer.asUint8List(
    fontData.offsetInBytes,
    fontData.lengthInBytes,
  );
  final fontLoader = FontLoader('Roboto')..addFont(Future.value(bytes));
  await fontLoader.load();
}
```

For CI, run goldens on a **Linux runner** for consistency — font rendering on
Linux is the most deterministic.

## Common pitfalls

**Pitfall: "widget not found" right after a tap.**
Cause: the `setState` rebuild hasn't happened yet. Fix: `await tester.pumpAndSettle()`
between the interaction and the assertion.

**Pitfall: An infinite animation never settles.**
Cause: `pumpAndSettle()` waits for the scheduler to go idle, but a looping
animation never does — it times out. Fix: use `pump(Duration)` to step forward
a fixed amount, or disable the animation in tests.

**Pitfall: Missing a wrapper widget.**
A bare widget without a `MaterialApp` / `Directionality` / `MediaQuery` throws
during build. Fix: wrap in `MaterialApp(home: ...)` (which provides theme,
direction, media query, and navigator).

**Pitfall: Tapping a widget that's behind a dialog.**
The finder matches widgets even if they're obscured. Use
`find.descendant` within the dialog context, or check `tester.getCenter()` to
verify the tap lands on the right layer.

**Pitfall: Flaky golden test on different platforms.**
Fix: pin a specific font and run CI goldens on Linux only. See the font loading
snippet above.

## Running widget tests

```bash
# All widget tests (files under test/ importing flutter_test)
flutter test

# A specific file
flutter test test/widgets/counter_test.dart

# With golden update
flutter test --update-goldens
```
