# Unit Testing in Flutter

Unit tests verify the behavior of a single function, method, or class in isolation.
They are fast (milliseconds), have no UI or platform dependencies, and form the
base of the testing pyramid.

## The `test` package

All unit tests use the core [`test`](https://pub.dev/packages/test) package.
Add it and [`mocktail`](https://pub.dev/packages/mocktail) to `dev_dependencies`:

```yaml
# pubspec.yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  test: ^1.25.0
  mocktail: ^1.0.4
```

### Anatomy of a test

```dart
import 'package:test/test.dart';
import 'package:my_app/src/calculator.dart';

void main() {
  group('Calculator', () {
    late Calculator calculator;

    setUp(() {
      calculator = Calculator();
    });

    tearDown(() {
      // cleanup if needed (close streams, reset singletons, etc.)
    });

    test('adds two positive numbers', () {
      expect(calculator.add(2, 3), equals(5));
    });

    test('throws on negative input', () {
      expect(
        () => calculator.add(-1, 5),
        throwsA(isA<ArgumentError>()),
      );
    });
  });
}
```

Key building blocks:

| API | Purpose |
|-----|---------|
| `test(name, body)` | Define a single test case |
| `group(name, body)` | Group related tests; shares `setUp`/`tearDown` |
| `expect(actual, matcher)` | Assert a condition |
| `expectLater(actual, matcher)` | Async-aware assertion (returns Future) |
| `setUp(() {})` | Runs before **each** test in the group |
| `setUpAll(() {})` | Runs once before all tests in the group |
| `tearDown(() {})` / `tearDownAll` | Cleanup counterparts |

## Matchers

Matchers are composable and produce readable failure messages. Prefer them over
manual `if` + `fail()`.

### Common matchers

```dart
// Equality
expect(result, equals(42));
expect(name, equals('Alice'));

// Collections
expect(list, contains(5));
expect(list, containsAll([1, 2, 3]));
expect(list, hasLength(3));
expect(list, isEmpty);
expect(list, orderedEquals([1, 2, 3]));

// Type checking
expect(error, isA<ArgumentError>());
expect(widget, isA<Text>());

// Strings
expect(message, contains('success'));
expect(message, startsWith('User'));
expect(message, matches(RegExp(r'^\d+$')));

// Booleans / null
expect(isValid, isTrue);
expect(isValid, isFalse);
expect(value, isNull);
expect(value, isNotNull);
```

### Exception matchers

```dart
// throwsA with type matcher
expect(
  () => parser.parse('bad json'),
  throwsA(isA<FormatException>()),
);

// throwsArgumentError is a built-in shortcut
expect(
  () => repository.fetch(-1),
  throwsArgumentError,
);

// throwsA with predicate for fine-grained checks
expect(
  () => validator.validateEmail('not-an-email'),
  throwsA(
    allOf(
      isA<ValidationException>(),
      predicate<ValidationException>((e) => e.field == 'email'),
    ),
  ),
);
```

### Composing matchers

```dart
// allOf = AND, anyOf = OR
expect(result, allOf(greaterThan(0), lessThan(100)));
expect(status, anyOf(equals('pending'), equals('processing')));

// isNot
expect(result, isNot(equals(-1)));
```

## Mocking with `mocktail`

`mocktail` is the community-standard mocking library for Dart — no code
generation required, null-safe, and works with plain Dart classes (no
annotations needed).

### Creating a mock

```dart
import 'package:mocktail/mocktail.dart';

// Real class
abstract class UserRepository {
  Future<User> fetchUser(String id);
  Stream<List<User>> watchUsers();
}

// Mock — extend Mock and implement the real class
class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late MockUserRepository repo;

  setUp(() {
    repo = MockUserRepository();
  });
}
```

### Stubbing with `when().thenAnswer()`

```dart
test('returns user when found', () async {
  // Arrange: stub the method
  when(() => repo.fetchUser('123')).thenAnswer(
    (_) async => User(id: '123', name: 'Alice'),
  );

  // Act
  final user = await repo.fetchUser('123');

  // Assert
  expect(user.name, 'Alice');
});
```

Three stubbing verbs:

```dart
// thenAnswer — for async (Future / Stream) or any method
when(() => api.fetch()).thenAnswer((_) async => data);

// thenReturn — for synchronous return values
when(() => formatter.format(42)).thenReturn('42');

// thenThrow — to simulate errors
when(() => repo.fetch('bad')).thenThrow(Exception('not found'));
```

### Argument matchers

```dart
// Match any argument
when(() => repo.fetchUser(any())).thenAnswer((_) async => testUser);

// Match specific values
when(() => repo.fetchUser('123')).thenAnswer((_) async => user1);
when(() => repo.fetchUser('456')).thenAnswer((_) async => user2);
```

### `registerFallbackValue` for `any()` with custom types

When using `any()` with a method whose parameter is a **custom type**, `mocktail`
needs to know a representative value for type inference. Register it once in
`setUpAll`:

```dart
class SaveUserRequest {
  final String name;
  final int age;
  SaveUserRequest({required this.name, required this.age});
}

class MockUserRepository extends Mock implements UserRepository {}

void main() {
  late MockUserRepository repo;

  setUpAll(() {
    registerFallbackValue(SaveUserRequest(name: '', age: 0));
  });

  setUp(() {
    repo = MockUserRepository();
  });

  test('save called with any request', () async {
    when(() => repo.save(any())).thenAnswer((_) async => true);

    await repo.save(SaveUserRequest(name: 'Bob', age: 30));

    verify(() => repo.save(any())).called(1);
  });
}
```

### Verification with `verify()`

```dart
// Verify a call happened
verify(() => repo.fetchUser('123')).called(1);     // exactly once
verify(() => repo.fetchUser(any())).called(greaterThan(0));
verifyNever(() => repo.delete(any()));             // never called

// verifyInOrder — check call sequence
verifyInOrder([
  () => repo.fetchUser('123'),
  () => cache.set('123', any()),
]);
```

### Resetting mocks

```dart
tearDown(() {
  reset(repo);        // clear stubs + interaction history
  // resetMocktailState();  // global reset (rarely needed)
});
```

## Coverage

Run tests with coverage instrumentation:

```bash
flutter test --coverage
```

This generates `coverage/lcov.info` — an lcov-format tracefile listing covered
lines per file. View it with `genhtml`:

```bash
# Install lcov (platform-dependent), then:
genhtml coverage/lcov.info -o coverage/html
open coverage/html/index.html
```

### Interpreting coverage

```
SF:lib/src/calculator.dart
DA:1,2    # line 1 executed 2 times
DA:2,2
DA:3,0    # line 3 NEVER executed — uncovered
end_of_record
```

Coverage is a **signal**, not a goal. 100% coverage with meaningless tests is
worse than 80% coverage with behavior-focused tests. Use coverage to find
untested branches, not to drive test count up.

## Running tests

```bash
# All tests
flutter test

# A specific file
flutter test test/src/calculator_test.dart

# By name pattern
flutter test --plain-name "adds two"

# With coverage
flutter test --coverage

# On a specific device (rarely needed for unit tests)
flutter test -d chrome
```

## Common pitfalls

**Pitfall: `any()` without `registerFallbackValue`.**
Error: `MissingDummyValueError`. Fix: call `registerFallbackValue` in `setUpAll`.

**Pitfall: Stubbing after the call.**
Stubs must be set up **before** the code under test runs. If you call the method
first then `when()`, you get `NoSuchMethodError` or the real implementation.

**Pitfall: Mocking concrete classes that lack a default constructor.**
`mocktail` can only mock classes it can subclass. Final classes, classes with
required positional constructor params, or classes backed by native code cannot
be mocked directly — extract an interface (abstract class) and mock that.

**Pitfall: Forgetting `reset()` between tests.**
Stubs and call records persist across tests unless reset. Always `reset` in
`tearDown` (or create a fresh mock in `setUp`).
