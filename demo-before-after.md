# HTTP Formatter Improvement: No Extra Newlines

## Problem
The HTTP formatter was adding extra newlines around variable names, named requests, and comments, making the formatted output unnecessarily verbose.

## Before (Old Behavior)
```http
# Variables - BEFORE formatting

@hostname = api.example.com

@port = 8080

@host = {{hostname}}:{{port}}

# This is a comment

# @name getUserInfo

GET https://example.com/user
```

## After (New Behavior)
```http
# Variables - BEFORE formatting
@hostname = api.example.com
@port = 8080
@host = {{hostname}}:{{port}}
# This is a comment
# @name getUserInfo

GET https://example.com/user
```

## Key Improvements

1. **Variables are grouped together** - No extra blank lines between consecutive variable definitions
2. **Comments are grouped with variables** - Comments and variables can be grouped together when they appear consecutively
3. **Named requests are grouped with comments** - `# @name` directives are grouped with other comments
4. **HTTP requests still properly separated** - Actual HTTP requests maintain proper spacing with blank lines before them
5. **Separators (###) maintain proper spacing** - Request blocks separated by `###` still have appropriate blank lines

## Technical Implementation

The formatter now uses intelligent grouping logic:
- Variables, comments, and named requests can be grouped together with single newlines
- HTTP requests are separated from other elements with double newlines
- Separators (`###`) properly flush groups and maintain spacing

This results in cleaner, more compact formatting while maintaining readability and proper structure.
