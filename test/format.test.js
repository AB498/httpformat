const assert = require('assert');
const { format } = require('../lib/http-parser');

describe('HTTP Format Tests', function() {
    describe('Basic Request Formatting', function() {
        it('should format simple GET request', function() {
            const input = `GET https://example.com`;
            const expected = `GET https://example.com`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format GET request with HTTP version', function() {
            const input = `GET https://example.com HTTP/1.1`;
            const expected = `GET https://example.com HTTP/1.1`;
            
            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format POST request with headers and JSON body', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json
Authorization: Bearer token123

{"name":"John","email":"john@example.com"}`;

            const expected = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json
Authorization: Bearer token123

{
    "name": "John",
    "email": "john@example.com"
}`;
            
            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });
    });

    describe('Variable Formatting', function() {
        it('should format file variables', function() {
            const input = `@hostname=api.example.com
@port=8080
@host={{hostname}}:{{port}}`;

            const expected = `@hostname = api.example.com
@port = 8080
@host = {{hostname}}:{{port}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format variables with system variables', function() {
            const input = `@timestamp={{$timestamp}}
@guid={{$guid}}
@datetime={{$datetime iso8601}}`;

            const expected = `@timestamp = {{$timestamp}}
@guid = {{$guid}}
@datetime = {{$datetime iso8601}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });
    });

    describe('Comment Formatting', function() {
        it('should format single line comments', function() {
            const input = `# This is a comment
# @name getUserInfo
GET https://example.com/user`;

            const expected = `# This is a comment
# @name getUserInfo

GET https://example.com/user`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format double slash comments', function() {
            const input = `// This is a comment
// @name createUser
POST https://example.com/users`;

            const expected = `// This is a comment
// @name createUser

POST https://example.com/users`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });
    });

    describe('Separator Formatting', function() {
        it('should format triple hash separators', function() {
            const input = `GET https://example.com/users
###
POST https://example.com/users`;

            const expected = `GET https://example.com/users

###

POST https://example.com/users`;
            
            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format multiple separators', function() {
            const input = `GET https://example.com/users
###
POST https://example.com/users
###
DELETE https://example.com/users/1`;

            const expected = `GET https://example.com/users

###

POST https://example.com/users

###

DELETE https://example.com/users/1`;
            
            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });
    });

    describe('Complex HTTP Methods', function() {
        it('should format all HTTP methods', function() {
            const input = `GET https://example.com/users
###
POST https://example.com/users
###
PUT https://example.com/users/1
###
PATCH https://example.com/users/1
###
DELETE https://example.com/users/1
###
HEAD https://example.com/users
###
OPTIONS https://example.com/users`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://example.com/users'));
            assert(formatted.includes('POST https://example.com/users'));
            assert(formatted.includes('PUT https://example.com/users/1'));
            assert(formatted.includes('PATCH https://example.com/users/1'));
            assert(formatted.includes('DELETE https://example.com/users/1'));
            assert(formatted.includes('HEAD https://example.com/users'));
            assert(formatted.includes('OPTIONS https://example.com/users'));
        });
    });

    describe('Query Parameters Formatting', function() {
        it('should format requests with query parameters', function() {
            const input = `GET https://api.example.com/users?page=1&limit=10&sort=name&order=asc HTTP/1.1
Accept: application/json`;

            const expected = `GET https://api.example.com/users?page=1&limit=10&sort=name&order=asc HTTP/1.1
Accept: application/json`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert.strictEqual(formatted.trim(), expected.trim());
        });

        it('should format multiline query parameters', function() {
            const input = `GET https://api.example.com/search
    ?q=javascript
    &type=repositories
    &sort=stars
    &order=desc HTTP/1.1`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://api.example.com/search'));
        });
    });

    describe('Headers Formatting', function() {
        it('should format various header types', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
Accept: application/json
User-Agent: MyApp/1.0
X-Custom-Header: custom-value
Cache-Control: no-cache
Connection: keep-alive

{"name":"test"}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Content-Type: application/json'));
            assert(formatted.includes('Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'));
            assert(formatted.includes('Accept: application/json'));
            assert(formatted.includes('User-Agent: MyApp/1.0'));
            assert(formatted.includes('X-Custom-Header: custom-value'));
            assert(formatted.includes('Cache-Control: no-cache'));
            assert(formatted.includes('Connection: keep-alive'));
        });
    });

    describe('Authentication Formatting', function() {
        it('should format Basic Auth', function() {
            const input = `GET https://api.example.com/protected HTTP/1.1
Authorization: Basic dXNlcjpwYXNzd29yZA==`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Authorization: Basic dXNlcjpwYXNzd29yZA=='));
        });

        it('should format Bearer Token', function() {
            const input = `GET https://api.example.com/protected HTTP/1.1
Authorization: Bearer {{authToken}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Authorization: Bearer {{authToken}}'));
        });

        it('should format API Key headers', function() {
            const input = `GET https://api.example.com/data HTTP/1.1
X-API-Key: {{apiKey}}
X-API-Secret: {{apiSecret}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('X-API-Key: {{apiKey}}'));
            assert(formatted.includes('X-API-Secret: {{apiSecret}}'));
        });
    });
});
