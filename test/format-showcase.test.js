const assert = require('assert');
const { format } = require('../lib/http-parser');

describe('HTTP Format Showcase', function() {
    it('should format a comprehensive real-world HTTP file', function() {
        const input = `@baseUrl=https://api.example.com
@apiKey={{$processEnv API_KEY}}
@userId=12345
@timestamp={{$timestamp}}

# Authentication endpoint
# @name login
POST {{baseUrl}}/auth/login HTTP/1.1
Content-Type: application/json
User-Agent: MyApp/1.0
X-API-Key: {{apiKey}}

{"username":"admin","password":"secret","timestamp":"{{timestamp}}"}

###

// Get user profile using token from login
# @name getUserProfile  
GET {{baseUrl}}/users/{{userId}} HTTP/1.1
Authorization: Bearer {{login.response.body.access_token}}
Accept: application/json
Cache-Control: no-cache

###

# Update user profile
PUT {{baseUrl}}/users/{{userId}} HTTP/1.1
Authorization: Bearer {{login.response.body.access_token}}
Content-Type: application/json

{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "preferences": {
        "theme": "dark",
        "notifications": true
    }
}

###

// Upload user avatar
POST {{baseUrl}}/users/{{userId}}/avatar HTTP/1.1
Authorization: Bearer {{login.response.body.access_token}}
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="profile.jpg"
Content-Type: image/jpeg

< ./assets/profile.jpg
------WebKitFormBoundary7MA4YWxkTrZu0gW--

###

# GraphQL query for user data
POST {{baseUrl}}/graphql HTTP/1.1
Authorization: Bearer {{login.response.body.access_token}}
Content-Type: application/json
X-REQUEST-TYPE: GraphQL

{"query":"query GetUser($id: ID!) { user(id: $id) { name email posts { title content createdAt } } }","variables":{"id":"{{userId}}"}}`;

        const [formatted, error] = format(input);
        
        assert.strictEqual(error, null, 'Should format without errors');
        assert(formatted, 'Should produce formatted output');
        
        // Check variable formatting
        assert(formatted.includes('@baseUrl = https://api.example.com'));
        assert(formatted.includes('@apiKey = {{$processEnv API_KEY}}'));
        assert(formatted.includes('@userId = 12345'));
        assert(formatted.includes('@timestamp = {{$timestamp}}'));
        
        // Check comment formatting
        assert(formatted.includes('# Authentication endpoint'));
        assert(formatted.includes('# @name login'));
        assert(formatted.includes('// Get user profile using token from login'));
        assert(formatted.includes('# @name getUserProfile'));
        
        // Check request formatting
        assert(formatted.includes('POST {{baseUrl}}/auth/login HTTP/1.1'));
        assert(formatted.includes('GET {{baseUrl}}/users/{{userId}} HTTP/1.1'));
        assert(formatted.includes('PUT {{baseUrl}}/users/{{userId}} HTTP/1.1'));
        
        // Check headers
        assert(formatted.includes('Content-Type: application/json'));
        assert(formatted.includes('Authorization: Bearer {{login.response.body.access_token}}'));
        assert(formatted.includes('X-API-Key: {{apiKey}}'));
        assert(formatted.includes('X-REQUEST-TYPE: GraphQL'));
        
        // Check separators
        assert(formatted.includes('###'));
        
        // Check JSON formatting (valid JSON should be formatted)
        assert(formatted.includes('"firstName": "John"'));
        assert(formatted.includes('"preferences": {'));
        assert(formatted.includes('    "theme": "dark"'));
        
        // Check JSON with variables (gets formatted since variables in strings are valid JSON)
        assert(formatted.includes('"username": "admin"'));
        assert(formatted.includes('"timestamp": "{{timestamp}}"'));
        
        // Check multipart form data
        assert(formatted.includes('multipart/form-data'));
        assert(formatted.includes('WebKitFormBoundary7MA4YWxkTrZu0gW'));
        assert(formatted.includes('< ./assets/profile.jpg'));
        
        // Check GraphQL
        assert(formatted.includes('query GetUser($id: ID!)'));
        assert(formatted.includes('"id": "{{userId}}"'));
        
        // Check request variable references
        assert(formatted.includes('{{login.response.body.access_token}}'));
        
        console.log('\n=== Formatted Output ===');
        console.log(formatted);
    });
});
