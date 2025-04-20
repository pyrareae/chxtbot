# Testing ChxtBot

This directory contains tests for the ChxtBot IRC utility. The tests use Mocha as the test runner, Chai for assertions, and Sinon for mocking and stubbing.

## Running Tests

To run all tests:

```bash
bun test
```

## Test Structure

The tests are organized according to the modules they cover:

- `commandRunner.spec.ts`: Tests for the command execution system
- `irc.spec.ts`: Tests for the IRC client functionality

## Testing Approach

### IRC Client Testing

The IRC client is tested using a mock implementation approach rather than mocking the actual dependency. This provides several benefits:

1. Tests are more isolated from the actual implementation
2. No need to mock complex external dependencies like the IRC framework
3. Easier to test edge cases and specific behaviors

The mock implementation (`MockChxtIrc`) mimics the functionality of the real IRC client but allows us to directly inspect internal state and manipulate events to test behavior.

### Command Runner Testing 

The Command Runner is tested by verifying that code is properly executed in the sandboxed environment.

## Writing New Tests

When writing new tests:

1. Use the existing mocks when possible
2. Add stubs for database operations
3. Keep tests focused on a single behavior
4. Follow the AAA pattern (Arrange, Act, Assert)

## Code Coverage

To generate code coverage reports:

```bash
bun test --coverage
```
