# HTTP Parser Tests

This directory contains comprehensive tests for the HTTP parser functionality.

## Test Structure

### Unit Tests
- **`http-parser.test.js`** - Core functionality tests for parsing and formatting
- **`lexer.test.js`** - Lexer-specific tests for token recognition and state transitions

### Integration Tests
- **`integration.test.js`** - End-to-end tests using real HTTP file fixtures

### Test Fixtures
- **`fixtures/sample-requests.http`** - Sample HTTP requests file for integration testing

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Test Coverage
```bash
npm run test:coverage
```

## Test Categories

### Basic HTTP Request Parsing
- Simple GET/POST/PUT/DELETE requests
- Requests with and without headers
- Requests with and without bodies
- Requests with and without HTTP versions

### Variable Parsing
- Variable declarations with different operators
- Complex variable values with templates
- Environment variable references

### Separator Handling
- Basic separators (`###`)
- Separators with comments
- Multiple consecutive separators

### Comment Handling
- Single `#` comments (e.g., `# @name apiEndpoint`)
- Comments with special characters
- Distinction between comments and separators

### Formatting Tests
- JSON body formatting
- Plain text body handling
- Variable formatting
- Error handling

### Edge Cases
- Empty input
- Malformed requests
- Mixed line endings
- Special characters
- Unicode content

### Integration Tests
- Complete HTTP files with multiple requests
- Data integrity through parse-format cycles
- Real-world usage scenarios

## Test Data

The test fixtures include:
- Variable declarations
- Multiple HTTP methods
- Complex JSON payloads
- Various header types
- Query parameters
- Authentication tokens

## Coverage Goals

The tests aim to cover:
- All lexer states and transitions
- All parser functionality
- All formatter features
- Error conditions and edge cases
- Real-world usage patterns

## Adding New Tests

When adding new tests:
1. Place unit tests in the appropriate existing file
2. Add integration tests to `integration.test.js`
3. Create new fixture files in `fixtures/` if needed
4. Follow the existing naming conventions
5. Include both positive and negative test cases
