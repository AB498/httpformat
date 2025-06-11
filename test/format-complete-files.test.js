const assert = require('assert');
const { format } = require('../lib/http-parser');

describe('Complete File Format Tests', function() {
    describe('Real-world HTTP Files', function() {
        it('should format a complete REST API test suite', function() {
            const input = `@baseUrl=https://jsonplaceholder.typicode.com
@userId=1
@postId=1

# @name getAllPosts
GET {{baseUrl}}/posts HTTP/1.1
Accept: application/json

###

# @name getPostById
GET {{baseUrl}}/posts/{{postId}} HTTP/1.1
Accept: application/json

###

# @name createPost
POST {{baseUrl}}/posts HTTP/1.1
Content-Type: application/json

{"title":"My New Post","body":"This is the content","userId":{{userId}}}

###

# @name updatePost
PUT {{baseUrl}}/posts/{{postId}} HTTP/1.1
Content-Type: application/json

{"id":{{postId}},"title":"Updated Post","body":"Updated content","userId":{{userId}}}

###

# @name deletePost
DELETE {{baseUrl}}/posts/{{postId}} HTTP/1.1`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            
            // Check that all variables are properly formatted
            assert(formatted.includes('@baseUrl = https://jsonplaceholder.typicode.com'));
            assert(formatted.includes('@userId = 1'));
            assert(formatted.includes('@postId = 1'));
            
            // Check that all request names are preserved
            assert(formatted.includes('# @name getAllPosts'));
            assert(formatted.includes('# @name getPostById'));
            assert(formatted.includes('# @name createPost'));
            assert(formatted.includes('# @name updatePost'));
            assert(formatted.includes('# @name deletePost'));
            
            // Check that separators are properly formatted
            assert(formatted.includes('###'));
            
            // Check that JSON with variables is preserved (not formatted since it's not valid JSON)
            assert(formatted.includes('"title":"My New Post"'));
            assert(formatted.includes('"body":"This is the content"'));
        });

        it('should format an authentication workflow', function() {
            const input = `@authUrl=https://api.example.com/auth
@apiUrl=https://api.example.com/v1
@username=testuser
@password=testpass

# @name login
POST {{authUrl}}/login HTTP/1.1
Content-Type: application/json

{"username":"{{username}}","password":"{{password}}"}

###

@token={{login.response.body.access_token}}

# @name getUserProfile
GET {{apiUrl}}/profile HTTP/1.1
Authorization: Bearer {{token}}
Accept: application/json

###

# @name updateProfile
PUT {{apiUrl}}/profile HTTP/1.1
Authorization: Bearer {{token}}
Content-Type: application/json

{"firstName":"John","lastName":"Doe","email":"john.doe@example.com"}

###

# @name logout
POST {{authUrl}}/logout HTTP/1.1
Authorization: Bearer {{token}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            
            // Check variable formatting
            assert(formatted.includes('@authUrl = https://api.example.com/auth'));
            assert(formatted.includes('@token = {{login.response.body.access_token}}'));
            
            // Check request chaining
            assert(formatted.includes('{{login.response.body.access_token}}'));
            assert(formatted.includes('Authorization: Bearer {{token}}'));
            
            // Check JSON formatting
            assert(formatted.includes('"username": "{{username}}"'));
            assert(formatted.includes('"firstName": "John"'));
        });

        it('should format a GraphQL API test suite', function() {
            const input = `@graphqlUrl=https://api.github.com/graphql
@token=ghp_xxxxxxxxxxxxxxxxxxxx

# @name getUserRepos
POST {{graphqlUrl}} HTTP/1.1
Authorization: Bearer {{token}}
Content-Type: application/json
X-REQUEST-TYPE: GraphQL

{"query":"query($login:String!){user(login:$login){repositories(first:10){nodes{name description stargazerCount}}}}","variables":{"login":"octocat"}}

###

# @name createIssue
POST {{graphqlUrl}} HTTP/1.1
Authorization: Bearer {{token}}
Content-Type: application/json
X-REQUEST-TYPE: GraphQL

{"query":"mutation($input:CreateIssueInput!){createIssue(input:$input){issue{id title}}}","variables":{"input":{"repositoryId":"MDEwOlJlcG9zaXRvcnkxMjk2MjY5","title":"New Issue","body":"Issue description"}}}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            
            // Check GraphQL-specific headers
            assert(formatted.includes('X-REQUEST-TYPE: GraphQL'));
            
            // Check that GraphQL queries are preserved
            assert(formatted.includes('"query"'));
            assert(formatted.includes('"variables"'));
            assert(formatted.includes('user(login:$login)'));
            assert(formatted.includes('createIssue(input:$input)'));
        });

        it('should format a file upload test suite', function() {
            const input = `@uploadUrl=https://api.example.com/upload

# @name uploadSingleFile
POST {{uploadUrl}}/single HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

< ./test-files/sample.txt
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="description"

Test file upload
------WebKitFormBoundary7MA4YWxkTrZu0gW--

###

# @name uploadWithMetadata
POST {{uploadUrl}}/metadata HTTP/1.1
Content-Type: application/json

<@ ./test-files/upload-metadata.json

###

# @name uploadBase64
POST {{uploadUrl}}/base64 HTTP/1.1
Content-Type: application/json

{"filename":"image.png","content":"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==","mimeType":"image/png"}`;

            const [formatted, error] = format(input);
            assert.strictEqual(error, null);
            
            // Check multipart form data formatting
            assert(formatted.includes('multipart/form-data'));
            assert(formatted.includes('WebKitFormBoundary7MA4YWxkTrZu0gW'));
            assert(formatted.includes('Content-Disposition: form-data'));
            
            // Check file references
            assert(formatted.includes('< ./test-files/sample.txt'));
            assert(formatted.includes('<@ ./test-files/upload-metadata.json'));
            
            // Check base64 content
            assert(formatted.includes('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='));
        });
    });

    describe('Error Recovery', function() {
        it('should handle and format files with mixed valid and invalid content', function() {
            const input = `@validVar=value

# Valid comment
GET https://example.com HTTP/1.1

###

Invalid line without proper format
Another invalid line

###

# @name validRequest
POST https://api.example.com HTTP/1.1
Content-Type: application/json

{"valid":"json"}

###

Malformed request line
No method or URL

###

# Final valid comment
GET https://final.example.com HTTP/1.1`;

            const [formatted, error] = format(input);
            // Should not throw an error even with malformed content
            assert.strictEqual(error, null);
            
            // Valid parts should still be formatted correctly
            assert(formatted.includes('@validVar = value'));
            assert(formatted.includes('# Valid comment'));
            assert(formatted.includes('# @name validRequest'));
            assert(formatted.includes('"valid": "json"'));
        });
    });
});
