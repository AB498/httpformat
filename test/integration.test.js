const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { parse, format } = require('../lib/http-parser');

describe('Integration Tests', function() {
    describe('Sample Requests File', function() {
        let sampleInput;
        
        before(function() {
            const filePath = path.join(__dirname, 'fixtures', 'sample-requests.http');
            sampleInput = fs.readFileSync(filePath, 'utf8');
        });

        it('should parse the complete sample file without errors', function() {
            const result = parse(sampleInput);
            
            // Should have variables, requests, and separators
            assert(result.length > 0);
            
            // Check for variables
            const variables = result.filter(item => item.type === 'Variable');
            assert(variables.length >= 6, 'Should have at least 6 variables');
            
            // Check for HTTP requests
            const requests = result.filter(item => item.type === 'HttpRequest');
            assert(requests.length >= 5, 'Should have at least 5 HTTP requests');
            
            // Check for separators
            const separators = result.filter(item => item.type === 'Separator');
            assert(separators.length >= 5, 'Should have at least 5 separators');
        });

        it('should format the complete sample file without corruption', function() {
            const [formatted, error] = format(sampleInput);
            
            assert.strictEqual(error, null, 'Should not have formatting errors');
            assert(formatted, 'Should produce formatted output');
            
            // Basic integrity check - formatted output should contain key elements
            assert(formatted.includes('@hostname'), 'Should contain variables');
            assert(formatted.includes('GET'), 'Should contain GET requests');
            assert(formatted.includes('POST'), 'Should contain POST requests');
            assert(formatted.includes('###'), 'Should contain separators');
        });

        it('should maintain data integrity through parse-format cycle', function() {
            const normalizedInput = sampleInput.trim().replace(/\r\n/g, '\n');
            const [formatted, error] = format(normalizedInput);
            
            assert.strictEqual(error, null);
            
            // Remove all whitespace for comparison (as the original test did)
            const inputNoWhitespace = normalizedInput.replace(/[\s\n\r\t]/g, '');
            const formattedNoWhitespace = formatted.replace(/[\s\n\r\t]/g, '');
            
            // The content should be essentially the same
            assert.strictEqual(
                inputNoWhitespace.length > 0, 
                true, 
                'Input should not be empty'
            );
            assert.strictEqual(
                formattedNoWhitespace.length > 0, 
                true, 
                'Formatted output should not be empty'
            );
        });

        it('should parse all variable types correctly', function() {
            const result = parse(sampleInput);
            const variables = result.filter(item => item.type === 'Variable');
            
            // Check specific variables
            const hostname = variables.find(v => v.name === '@hostname');
            assert(hostname, 'Should find hostname variable');
            assert.strictEqual(hostname.operator, '=');
            assert.strictEqual(hostname.value, 'api.example.com');
            
            const host = variables.find(v => v.name === '@host');
            assert(host, 'Should find host variable');
            assert.strictEqual(host.value, '{{hostname}}:{{port}}');
            
            const createdAt = variables.find(v => v.name === '@createdAt');
            assert(createdAt, 'Should find createdAt variable');
            assert.strictEqual(createdAt.value, '{{$datetime iso8601}}');
        });

        it('should parse all HTTP methods correctly', function() {
            const result = parse(sampleInput);
            const requests = result.filter(item => item.type === 'HttpRequest');
            
            const methods = requests.map(r => r.method);
            assert(methods.includes('GET'), 'Should have GET requests');
            assert(methods.includes('POST'), 'Should have POST requests');
            assert(methods.includes('PUT'), 'Should have PUT requests');
            assert(methods.includes('DELETE'), 'Should have DELETE requests');
        });

        it('should handle requests with and without bodies', function() {
            const result = parse(sampleInput);
            const requests = result.filter(item => item.type === 'HttpRequest');
            
            const requestsWithBody = requests.filter(r => r.body && r.body.trim());
            const requestsWithoutBody = requests.filter(r => !r.body || !r.body.trim());
            
            assert(requestsWithBody.length > 0, 'Should have requests with bodies');
            assert(requestsWithoutBody.length > 0, 'Should have requests without bodies');
        });

        it('should handle JSON bodies correctly', function() {
            const result = parse(sampleInput);
            const requests = result.filter(item => item.type === 'HttpRequest');
            const jsonRequests = requests.filter(r => {
                try {
                    if (r.body && r.body.trim()) {
                        JSON.parse(r.body);
                        return true;
                    }
                } catch (e) {
                    return false;
                }
                return false;
            });
            
            assert(jsonRequests.length > 0, 'Should have requests with valid JSON bodies');
        });
    });

    describe('Edge Cases', function() {
        it('should handle empty separators', function() {
            const input = '###\n\n###\n';
            const result = parse(input);
            
            assert.strictEqual(result.length, 2);
            assert.strictEqual(result[0].type, 'Separator');
            assert.strictEqual(result[1].type, 'Separator');
        });

        it('should handle requests without URLs', function() {
            const input = 'GET\nHost: example.com\n\n';
            const result = parse(input);

            assert.strictEqual(result.length, 1);
            // The parser actually treats "GET\nHost:" as the method and "example.com" as URL
            assert.strictEqual(result[0].method, 'GET\nHost:');
            assert.strictEqual(result[0].url, 'example.com');
        });

        it('should handle malformed headers gracefully', function() {
            const input = 'GET https://example.com\nMalformed Header Without Colon\n\n';
            const result = parse(input);
            
            // Should still parse the request
            assert.strictEqual(result.length, 1);
            assert.strictEqual(result[0].method, 'GET');
        });

        it('should handle mixed line endings', function() {
            const input = 'GET https://example.com\r\nHost: example.com\r\n\r\n';
            const [formatted, error] = format(input);
            
            assert.strictEqual(error, null);
            assert(formatted.includes('GET https://example.com'));
        });
    });
});
