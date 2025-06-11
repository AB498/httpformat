const assert = require('assert');
const { format } = require('../lib/http-parser');

describe('Complex HTTP Format Tests', function() {
    describe('JSON Body Formatting', function() {
        it('should format nested JSON objects', function() {
            const input = `POST https://api.example.com/users HTTP/1.1
Content-Type: application/json

{"user":{"name":"John Doe","email":"john@example.com","address":{"street":"123 Main St","city":"Anytown","country":"USA"},"preferences":{"theme":"dark","notifications":true}}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('"user"'));
            assert(formatted.includes('"address"'));
            assert(formatted.includes('"preferences"'));
            // Should be properly indented JSON
            assert(formatted.includes('    "name": "John Doe"'));
        });

        it('should format JSON arrays', function() {
            const input = `POST https://api.example.com/batch HTTP/1.1
Content-Type: application/json

[{"id":1,"name":"Item 1"},{"id":2,"name":"Item 2"},{"id":3,"name":"Item 3"}]`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('['));
            assert(formatted.includes(']'));
            assert(formatted.includes('"id": 1'));
            assert(formatted.includes('"name": "Item 1"'));
        });

        it('should format complex JSON with variables', function() {
            const input = `POST https://api.example.com/orders HTTP/1.1
Content-Type: application/json

{"orderId":"{{$guid}}","timestamp":"{{$timestamp}}","customer":{"id":"{{customerId}}","name":"{{customerName}}"},"items":[{"productId":"{{productId}}","quantity":{{quantity}},"price":{{price}}}]}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('{{$guid}}'));
            assert(formatted.includes('{{$timestamp}}'));
            assert(formatted.includes('{{customerId}}'));
            assert(formatted.includes('{{quantity}}'));
        });
    });

    describe('XML Body Formatting', function() {
        it('should format XML requests', function() {
            const input = `POST https://api.example.com/soap HTTP/1.1
Content-Type: application/xml
SOAPAction: "http://example.com/GetUserInfo"

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><GetUserInfo><UserId>123</UserId></GetUserInfo></soap:Body></soap:Envelope>`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Content-Type: application/xml'));
            assert(formatted.includes('SOAPAction: "http://example.com/GetUserInfo"'));
            // XML should be preserved as-is since it's not JSON
            assert(formatted.includes('<soap:Envelope'));
        });
    });

    describe('Form Data Formatting', function() {
        it('should format URL-encoded form data', function() {
            const input = `POST https://api.example.com/login HTTP/1.1
Content-Type: application/x-www-form-urlencoded

username=john&password=secret123&remember=true`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('Content-Type: application/x-www-form-urlencoded'));
            assert(formatted.includes('username=john&password=secret123&remember=true'));
        });

        it('should format multipart form data', function() {
            const input = `POST https://api.example.com/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

File content here
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

Test file upload
------WebKitFormBoundary7MA4YWxkTrZu0gW--`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('multipart/form-data'));
            assert(formatted.includes('WebKitFormBoundary7MA4YWxkTrZu0gW'));
            assert(formatted.includes('Content-Disposition: form-data'));
        });
    });

    describe('GraphQL Formatting', function() {
        it('should format GraphQL queries', function() {
            const input = `POST https://api.example.com/graphql HTTP/1.1
Content-Type: application/json
X-REQUEST-TYPE: GraphQL

{"query":"query GetUser($id: ID!) { user(id: $id) { name email posts { title content } } }","variables":{"id":"123"}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('X-REQUEST-TYPE: GraphQL'));
            assert(formatted.includes('"query"'));
            assert(formatted.includes('"variables"'));
        });
    });

    describe('File References', function() {
        it('should format file reference syntax', function() {
            const input = `POST https://api.example.com/upload HTTP/1.1
Content-Type: application/json

< ./test-data.json`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('< ./test-data.json'));
        });

        it('should format file reference with variables', function() {
            const input = `POST https://api.example.com/upload HTTP/1.1
Content-Type: application/json

<@ ./test-data.json`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('<@ ./test-data.json'));
        });
    });

    describe('System Variables', function() {
        it('should format all system variable types', function() {
            const input = `@requestId={{$guid}}
@timestamp={{$timestamp}}
@datetime={{$datetime iso8601}}
@localDatetime={{$localDatetime rfc1123}}
@randomNum={{$randomInt 1 100}}
@envVar={{$processEnv USER}}
@dotenvVar={{$dotenv API_KEY}}
@aadToken={{$aadToken}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            assert(formatted.includes('{{$guid}}'));
            assert(formatted.includes('{{$timestamp}}'));
            assert(formatted.includes('{{$datetime iso8601}}'));
            assert(formatted.includes('{{$localDatetime rfc1123}}'));
            assert(formatted.includes('{{$randomInt 1 100}}'));
            assert(formatted.includes('{{$processEnv USER}}'));
            assert(formatted.includes('{{$dotenv API_KEY}}'));
            assert(formatted.includes('{{$aadToken}}'));
        });
    });
});
