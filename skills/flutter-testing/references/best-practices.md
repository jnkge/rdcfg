# Testing Best Practices & Strategy

A test suite is a long-term investment. These principles keep it valuable —
fast, trustworthy, and maintainable — as the app grows.

## The Testing Pyramid

Distribute test effort by **cost vs. confidence**:

```
        /\
       /  \        Integration (few)     — high confidence, high cost
      /----\       verify complete flows on device/emulator
     /      \
    / Widget \     Widget (moderate)      — medium confidence, medium cost
   /----------\    verify single widget render + interaction
  /            \
 /    Unit      \  Unit (many)            — low confidence per test, very cheap
/________________\ verify pure logic in isolation
```

**Rough targets:**

| Layer | Quantity | Runtime | What it proves |
|-------|----------|---------|----------------|
| Unit | hundreds | <1s each | One function/class behaves correctly |
| Widget | dozens | <1s each | One widget renders and responds |
| Integration | a handful | 5-30s each | A real user can accomplish a goal |

Most test **count** should be unit tests (fast feedback, precise failures). Most
**confidence** comes from integration tests (they prove the pieces fit together).
Skipping either end weakens the suite.

## Naming

Test names are documentation. A good name describes the **behavior** and the
**condition**, never the implementation.

```dart
// BAD — describes the method, not the behavior
test('testAdd', () { ... });
test('calculator test 2', () { ... });

// GOOD — "should [behavior] when [condition]"
test('should return sum when adding two positives', () { ... });
test('should throw ArgumentError when input is negative', () { ... });

// In a group, the group name + test name reads as a sentence:
group('Calculator.add', () {
  test('should return 5 when adding 2 and 3', () { ... });
  test('should throw when either operand is negative', () { ... });
});
// Reads: "Calculator.add should return 5 when adding 2 and 3"
```

## AAA: Arrange-Act-Assert

Structure every test in three clearly separated phases. A test that mixes setup,
action, and assertions is hard to read and hard to debug.

```dart
test('should return user when id exists', () async {
  // Arrange — set up the state and stubs
  when(() => repo.fetchUser('123'))
      .thenAnswer((_) async => User(id: '123', name: 'Alice'));

  // Act — call the code under test, exactly once
  final result = await userService.getUser('123');

  // Assert — verify the outcome
  expect(result.isOk, isTrue);
  expect(result.value.name, 'Alice');
  verify(() => repo.fetchUser('123')).called(1);
});
```

If you cannot point to where Arrange ends and Act begins, the test is doing too
much. Split it.

## Test independence

Each test must be runnable **alone** and **in any order**, and must not leave
state that affects other tests.

```dart
// BAD — test B depends on test A running first
test('A: creates user', () {
  sharedUser = User(name: 'Alice');
  store.save(sharedUser);
});

test('B: fetches user', () {
  expect(store.get(sharedUser.id), isNotNull); // fails if A didn't run
});

// GOOD — each test sets up and tears down its own state
late MockStore store;

setUp(() {
  store = MockStore();          // fresh instance every test
  registerFallbackValue(User(name: '', id: ''));
});

tearDown(() {
  reset(store);                 // clear stubs + call history
});

test('fetches user after save', () async {
  final user = User(name: 'Alice', id: '1');
  when(() => store.save(any())).thenAnswer((_) async {});
  when(() => store.get('1')).thenAnswer((_) async => user);

  await store.save(user);
  final result = await store.get('1');

  expect(result, isNotNull);
});
```

Signs of a hidden dependency: a test passes in `dart test` but fails with
`dart test -p 1 --test-randomize-ordering-seed=random`.

## When to mock (and when not to)

**Mock** the dependencies of the unit under test so the test is about **that
unit's logic**, not its dependencies' correctness.

```dart
// GOOD — testing UserService, so mock UserRepository (its dependency)
class MockUserRepository extends Mock implements UserRepository {}

test('returns error when repo throws', () async {
  final repo = MockUserRepository();
  when(() => repo.fetchUser('1')).thenThrow(Exception('db down'));
  final service = UserService(repo);

  final result = await service.getUser('1');

  expect(result.isError, isTrue);
});
```

**Do NOT mock** the thing you are testing. If you stub the method under test,
you are testing the stub, not the code.

```dart
// BAD — mocking the code under test
class MockCalculator extends Mock implements Calculator {}

test('add returns 5', () {
  final calc = MockCalculator();
  when(() => calc.add(2, 3)).thenReturn(5);  // testing the stub!
  expect(calc.add(2, 3), 5);                  // always passes — meaningless
});
```

**Do NOT mock value objects** (`String`, `int`, `User`, `Money`). Use real
instances. Value objects have no behavior to stub; mocking them adds noise.

**Prefer fakes over mocks for simple interfaces.** A fake implements the real
interface with a trivial in-memory behavior, which is more resilient than a
stub-per-test:

```dart
class FakeAuthGateway implements AuthGateway {
  String? signedInAs;
  @override
  Future<void> signIn(String email) async => signedInAs = email;
  @override
  bool get isAuthenticated => signedInAs != null;
}
```

## Coverage as a signal

Coverage tells you which **lines** ran, not which **behaviors** are verified.
100% line coverage with assertion-free tests is worthless; 70% coverage with
behavior-focused tests is strong.

Use coverage to **find gaps**:

```bash
flutter test --coverage
genhtml coverage/lcov.info -o coverage/html
# Open coverage/html/index.html, look for dark red (uncovered) branches.
```

Reasonable targets:

- **Unit tests on core domain logic:** 90%+ — this is where bugs cost most.
- **Widget tests on interactive components:** 70%+ — focus on the happy path
  plus key error states.
- **Integration tests:** no numeric target — cover the top user journeys.

## Reducing flakiness

A flaky test (passes sometimes, fails others) destroys trust in the whole suite.
Root causes and fixes:

| Cause | Fix |
|-------|-----|
| Animation not finished | `await tester.pumpAndSettle()` |
| Async not awaited | `await` the future, or use `expectLater` |
| Real timer / clock | Use `tester.binding` fake time, or `fakeAsync` |
| Shared mutable state | Fresh instance per test in `setUp` |
| Test order dependency | `dart test --test-randomize-ordering-seed=random` in CI |
| Platform channel timing | Mock the channel; never rely on real platform latency |

Treat flakiness as a bug. If a test is flaky, either fix the timing issue or
delete the test — a suite you don't trust is worse than no suite.

## Reviewing tests

When reviewing a test, ask:

1. Does the **name** describe observable behavior (not implementation)?
2. Is there exactly **one reason** this test could fail?
3. If the code under test broke, would this test **fail**? (If not, it's a no-op.)
4. If the code were refactored (no behavior change), would this test **still
   pass**? (If not, it's testing implementation, not behavior.)
5. Can a new team member understand this test without reading the source?

A test that fails question 4 is over-coupled. A test that fails question 3 is
dead weight. Both should be rewritten or removed.
