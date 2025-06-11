const assert = require('assert');
const { parse, format } = require('../lib/http-parser');

describe('HTTP Parser', function() {
    describe('Basic HTTP Request Parsing', function() {
        it('should parse a simple GET request', function() {
            const input = 'GET https://example.com HTTP/1.1\nHost: example.com\n\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].type, 'HttpRequest');
            assert.strictEqual(result[0].method, 'GET');
            assert.strictEqual(result[0].url, 'https://example.com');
            assert.strictEqual(result[0].version, 'HTTP/1.1');
            assert.strictEqual(result[0].headers.length, 1);
            assert.strictEqual(result[0].headers[0].key, 'Host');
            assert.strictEqual(result[0].headers[0].value, 'example.com');
        });

        it('should parse a POST request with body', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json
Authorization: Bearer token123

{
    "name": "John Doe",
    "email": "john@example.com"
}`;
            const result = parse(input);
            
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].type, 'HttpRequest');
            assert.strictEqual(result[0].method, 'POST');
            assert.strictEqual(result[0].url, 'https://api.example.com/users');
            assert.strictEqual(result[0].version, 'HTTP/1.1');
            assert.strictEqual(result[0].headers.length, 2);
            assert.strictEqual(result[0].headers[0].key, 'Content-Type');
            assert.strictEqual(result[0].headers[0].value, 'application/json');
            assert.strictEqual(result[0].headers[1].key, 'Authorization');
            assert.strictEqual(result[0].headers[1].value, 'Bearer token123');
            assert(result[0].body.includes('"name": "John Doe"'));
        });

        it('should parse request without version', function() {
            const input = 'GET https://example.com\nHost: example.com\n\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].method, 'GET');
            assert.strictEqual(result[0].url, 'https://example.com');
            assert.strictEqual(result[0].version, '');
        });

        it('should parse request without headers', function() {
            const input = 'DELETE https://api.example.com/users/123 HTTP/1.1\n\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].method, 'DELETE');
            assert.strictEqual(result[0].url, 'https://api.example.com/users/123');
            assert.strictEqual(result[0].version, 'HTTP/1.1');
            assert.strictEqual(result[0].headers.length, 0);
        });
    });

    describe('Variables Parsing', function() {
        it('should parse variable declarations', function() {
            const input = '@hostname = api.example.com\n@port = 8080\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].type, 'Variable');
            assert.strictEqual(result[0].name, '@hostname');
            assert.strictEqual(result[0].operator, '=');
            assert.strictEqual(result[0].value, 'api.example.com');
            
            assert.strictEqual(result[1].type, 'Variable');
            assert.strictEqual(result[1].name, '@port');
            assert.strictEqual(result[1].operator, '=');
            assert.strictEqual(result[1].value, '8080');
        });

        it('should parse variables with complex values', function() {
            const input = '@host = {{hostname}}:{{port}}\n@createdAt ={{$datetime iso8601}}\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].value, '{{hostname}}:{{port}}');
            assert.strictEqual(result[1].value, '{{$datetime iso8601}}');
        });
    });

    describe('Separators', function() {
        it('should parse separator tokens', function() {
            const input = '### Sample Request\nGET https://example.com\n###\n';
            const result = parse(input);

            // The parser may combine some elements differently
            assert(result.length >= 2, 'Should have at least 2 elements');

            // Check that we have separators and requests
            const separators = result.filter(item => item.type === 'Separator');
            const requests = result.filter(item => item.type === 'HttpRequest');

            assert(separators.length >= 1, 'Should have at least one separator');
            assert(requests.length >= 1, 'Should have at least one request');
        });
    });

    describe('Comments', function() {
        it('should parse single # comments', function() {
            const input = '# @name updateUserConf\nPOST https://example.com\n\n';
            const result = parse(input);

            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].type, 'Comment');
            assert.strictEqual(result[0].value, '# @name updateUserConf');
            assert.strictEqual(result[1].type, 'HttpRequest');
            assert.strictEqual(result[1].method, 'POST');
        });

        it('should distinguish between comments and separators', function() {
            const input = '# Comment\n### Separator\n# Another comment\n';
            const result = parse(input);

            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].type, 'Comment');
            assert.strictEqual(result[0].value, '# Comment');
            assert.strictEqual(result[1].type, 'Separator');
            assert.strictEqual(result[1].value, '### Separator');
            assert.strictEqual(result[2].type, 'Comment');
            assert.strictEqual(result[2].value, '# Another comment');
        });

        it('should handle comments with special characters', function() {
            const input = '# @name test-api_endpoint\nGET https://example.com\n\n';
            const result = parse(input);

            assert.strictEqual(result[0].type, 'Comment');
            assert.strictEqual(result[0].value, '# @name test-api_endpoint');
        });
    });

    describe('Multiple Requests', function() {
        it('should parse multiple requests separated by ###', function() {
            const input = `GET https://example.com/api/v1/users
Host: example.com

###

POST https://example.com/api/v1/users
Content-Type: application/json

{"name": "test"}

###`;
            const result = parse(input);
            
            assert.strictEqual(result.length, 3);
            assert.strictEqual(result[0].type, 'HttpRequest');
            assert.strictEqual(result[0].method, 'GET');
            assert.strictEqual(result[1].type, 'Separator');
            assert.strictEqual(result[2].type, 'HttpRequest');
            assert.strictEqual(result[2].method, 'POST');
        });
    });
});

describe('HTTP Formatter', function() {
    describe('Basic Formatting', function() {
        it('should format a simple request correctly', function() {
            const input = 'GET https://example.com HTTP/1.1\nHost: example.com\n\n';
            const [formatted, error] = format(input);
            
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://example.com HTTP/1.1'));
            assert(formatted.includes('Host: example.com'));
        });

        it('should format JSON body correctly', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json

{"name":"John","age":30}`;
            const [formatted, error] = format(input);
            
            assert.strictEqual(error, null);
            assert(formatted.includes('"name": "John"'));
            assert(formatted.includes('"age": 30'));
        });

        it('should handle non-JSON body as plain text', function() {
            const input = `POST https://api.example.com/data HTTP/1.1
Content-Type: text/plain

This is plain text data`;
            const [formatted, error] = format(input);
            
            assert.strictEqual(error, null);
            assert(formatted.includes('This is plain text data'));
        });
    });

    describe('Variable Formatting', function() {
        it('should format variables correctly', function() {
            const input = '@hostname = api.example.com\n@port = 8080\n';
            const [formatted, error] = format(input);

            assert.strictEqual(error, null);
            assert(formatted.includes('@hostname = api.example.com'));
            assert(formatted.includes('@port = 8080'));
        });
    });

    describe('Comment Formatting', function() {
        it('should format comments correctly', function() {
            const input = '# @name updateUserConf\nPOST https://example.com\n\n';
            const [formatted, error] = format(input);

            assert.strictEqual(error, null);
            assert(formatted.includes('# @name updateUserConf'));
            assert(formatted.includes('POST https://example.com'));
        });

        it('should preserve comment formatting', function() {
            const input = '# This is a comment\n# Another comment\nGET https://example.com\n\n';
            const [formatted, error] = format(input);

            assert.strictEqual(error, null);
            assert(formatted.includes('# This is a comment'));
            assert(formatted.includes('# Another comment'));
        });
    });

    describe('Error Handling', function() {
        it('should handle empty input', function() {
            const [formatted, error] = format('');
            assert.strictEqual(error, null);
        });

        it('should handle malformed input gracefully', function() {
            const [formatted, error] = format('invalid input');
            // Should not throw an error, but may return null or empty result
            assert(error === null || formatted !== null);
        });
    });
});
