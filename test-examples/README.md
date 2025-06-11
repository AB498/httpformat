# HTTP Format Test Examples

This directory contains before/after examples showing how the HTTP formatter processes various types of HTTP request files. Each pair demonstrates specific formatting capabilities and edge cases.

## 📁 File Structure

Each example has two files:
- `*-before.http` - Original unformatted input
- `*-after.http` - Formatted output produced by the formatter

## 🎯 Examples Overview

### 00. Comprehensive Showcase
**Files:** `00-comprehensive-showcase-before.http` → `00-comprehensive-showcase-after.http`
**Lines:** 101 → 173 (+72 lines for better readability)

**Demonstrates:**
- Complete real-world API workflow
- Authentication with token chaining
- All variable types (file, system, request)
- Multiple comment styles
- JSON formatting with proper indentation
- Multipart form data
- GraphQL queries
- Unicode content
- File references
- Complex nested JSON structures

### 01. Basic Requests
**Files:** `01-basic-requests-before.http` → `01-basic-requests-after.http`
**Lines:** 11 → 23 (+12 lines for spacing)

**Demonstrates:**
- Simple GET requests with/without HTTP version
- POST requests with headers
- JSON body formatting
- Request separators (`###`)

### 02. Variables
**Files:** `02-variables-before.http` → `02-variables-after.http`
**Lines:** 15 → 22 (+7 lines for spacing)

**Demonstrates:**
- File variable declarations (`@variable = value`)
- System variables (`{{$timestamp}}`, `{{$guid}}`, etc.)
- Environment variables (`{{$processEnv}}`, `{{$dotenv}}`)
- Complex variable values (`{{hostname}}:{{port}}`)
- Variable usage in requests

### 03. Comments
**Files:** `03-comments-before.http` → `03-comments-after.http`
**Lines:** 27 → 38 (+11 lines for spacing)

**Demonstrates:**
- Single hash comments (`# comment`)
- Double slash comments (`// comment`)
- Special comment syntax (`# @name`, `// @prompt`)
- TODO/FIXME comments
- Comment preservation and spacing

### 04. Authentication
**Files:** `04-authentication-before.http` → `04-authentication-after.http`
**Lines:** 36 → 52 (+16 lines for spacing and JSON formatting)

**Demonstrates:**
- Authentication workflow
- Request variable chaining (`{{login.response.body.access_token}}`)
- Token-based authentication
- JSON formatting in request bodies
- Multi-step API interactions

### 05. Complex Data Types
**Files:** `05-complex-data-before.http` → `05-complex-data-after.http`
**Lines:** 52 → 61 (+9 lines for JSON formatting)

**Demonstrates:**
- GraphQL queries with variables
- Multipart form data with file uploads
- URL-encoded form data
- XML/SOAP requests
- File references (`< file.txt`, `<@ file.json`)
- Different content types

### 06. Edge Cases
**Files:** `06-edge-cases-before.http` → `06-edge-cases-after.http`
**Lines:** 48 → 84 (+36 lines for JSON formatting and spacing)

**Demonstrates:**
- Unicode and special characters (emojis, international text)
- Complex query parameters with encoding
- Long authorization headers (JWT tokens)
- Malformed JSON (preserved as-is)
- Requests without HTTP version
- Empty body requests
- Error handling and graceful degradation

## 🔍 Key Formatting Features Demonstrated

### ✅ Variable Formatting
```http
# Before
@hostname=api.example.com

# After  
@hostname = api.example.com
```

### ✅ JSON Formatting
```http
# Before
{"name":"John","age":30}

# After
{
    "name": "John",
    "age": 30
}
```

### ✅ Comment Spacing
```http
# Before
# Comment
GET https://example.com

# After
# Comment

GET https://example.com
```

### ✅ Request Separation
```http
# Before
GET https://example.com
###
POST https://example.com

# After
GET https://example.com

###

POST https://example.com
```

### ✅ Header Formatting
```http
# Before
Content-Type:application/json
Authorization:Bearer token

# After
Content-Type: application/json
Authorization: Bearer token
```

## 📊 Statistics

- **Total Examples:** 7 files (14 files including before/after pairs)
- **Total Lines Before:** 290 lines
- **Total Lines After:** 453 lines (+163 lines for improved readability)
- **Features Covered:** All major VS Code REST Client syntax features
- **Test Coverage:** 94 automated tests covering all scenarios

## 🚀 Usage

To regenerate the after files:
```bash
node create-before-after-examples.js
```

To run the comprehensive test suite:
```bash
npm run test:unit
```

## 🎨 Visual Comparison

Open any before/after pair in VS Code to see the visual differences:
- Better spacing and readability
- Proper JSON indentation
- Consistent variable formatting
- Clear request separation
- Preserved functionality with improved aesthetics
