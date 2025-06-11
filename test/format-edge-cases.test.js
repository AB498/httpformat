const assert = require('assert');
const { format } = require('../lib/http-parser');

describe('HTTP Format Edge Cases', function() {
    describe('Request Variables and Chaining', function() {
        it('should format request variable definitions', function() {
            const input = `# @name login
POST https://api.example.com/auth/login HTTP/1.1
Content-Type: application/json

{"username":"admin","password":"secret"}

###

# @name getProfile
GET https://api.example.com/profile HTTP/1.1
Authorization: Bearer {{login.response.body.token}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('# @name login'));
            assert(formatted.includes('# @name getProfile'));
            assert(formatted.includes('{{login.response.body.token}}'));
        });

        it('should format complex request variable references', function() {
            const input = `# @name createUser
POST https://api.example.com/users HTTP/1.1

{"name":"Test User"}

###

# @name updateUser
PUT https://api.example.com/users/{{createUser.response.body.$.id}} HTTP/1.1
Authorization: {{createUser.response.headers.X-Auth-Token}}

{"name":"Updated User","lastModified":"{{$timestamp}}"}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('{{createUser.response.body.$.id}}'));
            assert(formatted.includes('{{createUser.response.headers.X-Auth-Token}}'));
        });
    });

    describe('Prompt Variables', function() {
        it('should format prompt variable definitions', function() {
            const input = `# @prompt username
# @prompt password Your password
# @prompt apiKey Your API key from the dashboard
POST https://api.example.com/login HTTP/1.1

{"username":"{{username}}","password":"{{password}}","apiKey":"{{apiKey}}"}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('# @prompt username'));
            assert(formatted.includes('# @prompt password Your password'));
            assert(formatted.includes('# @prompt apiKey Your API key from the dashboard'));
            assert(formatted.includes('{{username}}'));
            assert(formatted.includes('{{password}}'));
            assert(formatted.includes('{{apiKey}}'));
        });
    });

    describe('Mixed Content Types', function() {
        it('should format requests with different content types', function() {
            const input = `POST https://api.example.com/text HTTP/1.1
Content-Type: text/plain

This is plain text content

###

POST https://api.example.com/html HTTP/1.1
Content-Type: text/html

<html><body><h1>Hello World</h1></body></html>

###

POST https://api.example.com/csv HTTP/1.1
Content-Type: text/csv

name,email,age
John,john@example.com,30
Jane,jane@example.com,25`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Content-Type: text/plain'));
            assert(formatted.includes('Content-Type: text/html'));
            assert(formatted.includes('Content-Type: text/csv'));
            assert(formatted.includes('This is plain text content'));
            assert(formatted.includes('<html><body><h1>Hello World</h1></body></html>'));
            assert(formatted.includes('name,email,age'));
        });
    });

    describe('Unicode and Special Characters', function() {
        it('should format requests with Unicode content', function() {
            const input = `POST https://api.example.com/unicode HTTP/1.1
Content-Type: application/json

{"message":"Hello 世界! 🌍","emoji":"😀😃😄😁","chinese":"你好","japanese":"こんにちは","arabic":"مرحبا"}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Hello 世界! 🌍'));
            assert(formatted.includes('😀😃😄😁'));
            assert(formatted.includes('你好'));
            assert(formatted.includes('こんにちは'));
            assert(formatted.includes('مرحبا'));
        });

        it('should format requests with special characters in URLs', function() {
            const input = `GET https://api.example.com/search?q=hello%20world&filter=type%3Duser HTTP/1.1`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('q=hello%20world'));
            assert(formatted.includes('filter=type%3Duser'));
        });
    });

    describe('Large Payloads', function() {
        it('should format requests with large JSON payloads', function() {
            const largeObject = {
                users: Array.from({length: 10}, (_, i) => ({
                    id: i + 1,
                    name: `User ${i + 1}`,
                    email: `user${i + 1}@example.com`,
                    metadata: {
                        created: '2023-01-01',
                        updated: '2023-12-31',
                        tags: [`tag${i}`, `category${i}`]
                    }
                }))
            };

            const input = `POST https://api.example.com/bulk HTTP/1.1
Content-Type: application/json

${JSON.stringify(largeObject)}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Content-Type: application/json'));
            assert(formatted.includes('"users"'));
            assert(formatted.includes('"User 1"'));
        });
    });

    describe('Malformed Input Handling', function() {
        it('should handle missing HTTP version gracefully', function() {
            const input = `GET https://example.com
Host: example.com`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://example.com'));
        });

        it('should handle malformed JSON gracefully', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json

{"name":"John","email":}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            // Should preserve malformed JSON as-is
            assert(formatted.includes('{"name":"John","email":}'));
        });

        it('should handle mixed line endings', function() {
            const input = "GET https://example.com\r\nHost: example.com\r\n\r\n";

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://example.com'));
            assert(formatted.includes('Host: example.com'));
        });
    });

    describe('Environment-specific Formatting', function() {
        it('should format environment variable references', function() {
            const input = `@baseUrl={{$shared.baseUrl}}
@apiKey={{$shared.apiKey}}
@environment={{$shared.environment}}

GET {{baseUrl}}/users HTTP/1.1
X-API-Key: {{apiKey}}
X-Environment: {{environment}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('{{$shared.baseUrl}}'));
            assert(formatted.includes('{{$shared.apiKey}}'));
            assert(formatted.includes('{{$shared.environment}}'));
        });
    });

    describe('Comments with Special Syntax', function() {
        it('should format various comment styles', function() {
            const input = `# Standard comment
// Alternative comment style
# @name requestName
// @prompt variable
# TODO: Add authentication
// FIXME: Update endpoint URL
### This is also a comment in some contexts

GET https://example.com HTTP/1.1`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('# Standard comment'));
            assert(formatted.includes('// Alternative comment style'));
            assert(formatted.includes('# @name requestName'));
            assert(formatted.includes('// @prompt variable'));
            assert(formatted.includes('# TODO: Add authentication'));
            assert(formatted.includes('// FIXME: Update endpoint URL'));
        });
    });

    describe('Completely Messed Up File Handling', function() {
        it('should format a completely chaotic file with whitespace mess', function() {
            const input = `# Messy file
   @baseUrl=https://api.example.com
@port   =    8080
  @host={{baseUrl}}:{{port}}

    # Comment with weird spacing
POST    {{host}}/auth/login    HTTP/1.1
Content-Type:application/json
   Authorization:   Bearer    token123

{"username"   :   "admin"   ,"password":"secret","nested":{"key":"value","array":[1,2,3]}}

###

   # Another comment
GET   {{host}}/users
Accept   :   application/json   `;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);

            // Check that variables are properly formatted
            assert(formatted.includes('@baseUrl = https://api.example.com'));
            assert(formatted.includes('@port = 8080'));
            assert(formatted.includes('@host = {{baseUrl}}:{{port}}'));

            // Check that headers are properly formatted
            assert(formatted.includes('Content-Type: application/json'));
            assert(formatted.includes('Authorization: Bearer token123'));
            assert(formatted.includes('Accept: application/json'));

            // Check that JSON is properly indented
            assert(formatted.includes('"username": "admin"'));
            assert(formatted.includes('"nested": {'));
            assert(formatted.includes('    "key": "value"'));
            assert(formatted.includes('    "array": ['));

            // Check that comments have proper spacing
            assert(formatted.includes('# Comment with weird spacing'));
            assert(formatted.includes('# Another comment'));

            // Check that separators are clean
            assert(formatted.includes('###'));

            // Should not contain excessive whitespace
            assert(!formatted.includes('   @baseUrl'));
            assert(!formatted.includes('POST    {{host}}'));
            assert(!formatted.includes('Content-Type:application/json'));
        });

        it('should handle mixed line endings in basic scenarios', function() {
            const input = "GET https://example.com\r\nAccept: application/json\r\n";

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);

            assert(formatted.includes('GET https://example.com'));
            assert(formatted.includes('Accept: application/json'));
        });
    });
});
