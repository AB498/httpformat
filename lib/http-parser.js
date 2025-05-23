// Lexer states
const LexerState = {
    START: 'START',
    METHOD: 'METHOD',
    URL: 'URL',
    VERSION: 'VERSION',
    HEADER_NAME: 'HEADER_NAME',
    HEADER_VALUE: 'HEADER_VALUE',
    BODY: 'BODY',
    SEPARATOR: 'SEPARATOR',
    VAR_NAME: 'VAR_NAME',
    VAR_VALUE: 'VAR_VALUE',
    OPERATOR: 'OPERATOR'
};

// Token types
const TokenType = {
    METHOD: 'METHOD',
    URL: 'URL',
    VERSION: 'VERSION',
    HEADER_NAME: 'HEADER_NAME',
    HEADER_VALUE: 'HEADER_VALUE',
    BODY: 'BODY',
    WHITESPACE: 'WHITESPACE',
    NEWLINE: 'NEWLINE',
    COLON: 'COLON',
    SEPARATOR: 'SEPARATOR',
    VAR_NAME: 'VAR_NAME',
    VAR_VALUE: 'VAR_VALUE',
    OPERATOR: 'OPERATOR'
};

class HTTPLexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.state = LexerState.START;
        this.tokens = [];
        this.currentToken = '';
        this.operators = ['+', '-', '*', '/', '='];
    }

    peek() {
        return this.pos < this.input.length ? this.input[this.pos] : null;
    }

    advance() {
        this.pos++;
    }

    isWhitespace(char) {
        return char === ' ' || char === '\t';
    }

    lex() {
        while (this.pos < this.input.length) {
            const char = this.peek();

            switch (this.state) {
                case LexerState.START:
                    this.handleStartState(char);
                    break;

                case LexerState.VAR_NAME:
                    this.handleVarNameState(char);
                    break;

                case LexerState.OPERATOR:
                    this.handleOperatorState(char);
                    break;

                case LexerState.VAR_VALUE:
                    this.handleVarValueState(char);
                    break;

                case LexerState.METHOD:
                    this.handleMethodState(char);
                    break;

                case LexerState.URL:
                    this.handleUrlState(char);
                    break;

                case LexerState.VERSION:
                    this.handleVersionState(char);
                    break;

                case LexerState.HEADER_NAME:
                    this.handleHeaderNameState(char);
                    break;

                case LexerState.HEADER_VALUE:
                    this.handleHeaderValueState(char);
                    break;

                case LexerState.BODY:
                    this.handleBodyState(char);
                    break;

                case LexerState.SEPARATOR:
                    this.handleSeparatorState(char);
                    break;
            }

            this.advance();
        }

        // Handle any remaining token
        this.emitCurrentToken();
        return this.tokens;
    }

    handleStartState(char) {
        if (char === 'h' && this.input.slice(this.pos, this.pos + 4) === 'http') {
            this.emitToken(TokenType.METHOD);
            this.state = LexerState.URL;
            this.currentToken = char;
        } else if (this.isWhitespace(char) || char === '\n') {
            return;
        } else if (char === '#') {
            this.state = LexerState.SEPARATOR;
            this.currentToken = char;
        } else if (char === '@') {
            this.state = LexerState.VAR_NAME;
            this.currentToken = char;
        } else {
            this.state = LexerState.METHOD;
            this.currentToken = char;
        }
    }

    handleVarNameState(char) {
        if (!/[a-zA-Z0-9]/.test(char)) {
            this.emitToken(TokenType.VAR_NAME);
            this.state = LexerState.OPERATOR;
            if (!this.isWhitespace(char)) {
                this.currentToken = char;
            }
        }
        else if (char === '\n') {
            this.emitToken(TokenType.VAR_NAME);
            this.state = LexerState.START;
        }
        else if (this.isWhitespace(char)) {
            return;
        }
        else {
            this.currentToken += char;
        }
    }

    handleOperatorState(char) {
        if (this.currentToken) {
            this.emitToken(TokenType.OPERATOR);
            this.state = LexerState.VAR_VALUE;
            if (!this.isWhitespace(char))
                this.currentToken = char;
        } else if (this.isWhitespace(char)) {
            return;
        } else {
            this.currentToken += char;
        }
    }

    handleVarValueState(char) {
        if (char === '\n') {
            this.emitToken(TokenType.VAR_VALUE);
            this.state = LexerState.START;
        }
        else if (this.isWhitespace(char) && !this.currentToken) {
            return;
        }
        else {
            this.currentToken += char;
        }
    }


    handleMethodState(char) {
        if (this.isWhitespace(char)) {
            this.emitToken(TokenType.METHOD);
            this.state = LexerState.URL;
        } else {
            this.currentToken += char;
        }
    }


    handleUrlState(char) {
        if (char === '\n') {
            this.emitToken(TokenType.URL);
            this.emitToken(TokenType.VERSION);
            this.state = LexerState.HEADER_NAME;
            return
        }
        if (this.isWhitespace(char)) {
            if (this.currentToken) {
                this.emitToken(TokenType.URL);
                this.state = LexerState.VERSION;
            }
        } else {
            this.currentToken += char;
        }
    }

    handleVersionState(char) {
        if (char === '\n') {
            if (this.currentToken) {
                this.emitToken(TokenType.VERSION);
            }
            this.emitToken(TokenType.NEWLINE);
            this.state = LexerState.HEADER_NAME;
        } else if (!this.isWhitespace(char)) {
            this.currentToken += char;
        }
    }

    handleHeaderNameState(char) {
        if (this.isWhitespace(char)) {
            return
        } else if (char === ':') {
            this.emitToken(TokenType.HEADER_NAME);
            this.emitToken(TokenType.COLON);
            this.state = LexerState.HEADER_VALUE;
        } else if (char === '\n') {
            if (this.currentToken.trim() === '') {
                this.state = LexerState.BODY;
            }
            this.emitToken(TokenType.NEWLINE);
        } else if (!this.isWhitespace(char)) {
            this.currentToken += char;
        }
    }

    handleHeaderValueState(char) {
        if (char === '\n') {
            const nextChar = this.input[this.pos + 1];
            if (this.isWhitespace(nextChar)) {
                this.emitToken(TokenType.HEADER_VALUE);
                this.emitToken(TokenType.NEWLINE);
                this.state = LexerState.HEADER_NAME;
                return
            }
            if (nextChar && /[a-zA-Z0-9-]/.test(nextChar)) {
                this.emitToken(TokenType.HEADER_VALUE);
                this.emitToken(TokenType.NEWLINE);
                this.state = LexerState.HEADER_NAME;
            } else {
                this.emitToken(TokenType.HEADER_VALUE);
                this.state = LexerState.BODY;
            }
        } else if (!this.isWhitespace(char) || this.currentToken) {
            this.currentToken += char;
        }
    }

    handleBodyState(char) {
        if (char === '#') {
            // Look ahead to check if this is the start of a separator
            if (this.input.slice(this.pos, this.pos + 3) === '###') {
                if (this.currentToken) {
                    this.emitToken(TokenType.BODY);
                }
                this.currentToken = '#';
                this.state = LexerState.SEPARATOR;
                return;
            }
        }
        this.currentToken += char;
    }

    handleSeparatorState(char) {
        if (char === '#') {
            this.currentToken += char;
        } else if (char === '\n') {
            if (this.currentToken.slice(0, 3) === '###') {
                this.emitToken(TokenType.SEPARATOR);
                this.state = LexerState.START;
            }
            this.currentToken = '';
        } else {
            this.currentToken += char;
        }
    }

    emitToken(type) {
        if (type === TokenType.METHOD && !this.currentToken) {
            this.currentToken = '__NULL__';
        }
        if (type === TokenType.VERSION && !this.currentToken) {
            this.currentToken = '__NULL__';
        }
        if (this.currentToken || type === TokenType.NEWLINE) {
            this.tokens.push({
                type,
                value: this.currentToken.trim()
            });
            this.currentToken = '';
        }
    }

    emitCurrentToken() {
        if (this.currentToken) {
            this.tokens.push({
                type: this.state === LexerState.BODY ? TokenType.BODY : TokenType.TEXT,
                value: this.currentToken.trim()
            });
        }
    }
}

class HTTPParser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0;
        // console.log(this.tokens);
    }

    parse() {
        const rootTokens = [];
        let currentRequest = null;
        while (this.current < this.tokens.length) {

            const token = this.tokens[this.current];

            switch (token.type) {
                case TokenType.VAR_NAME:
                    if (currentRequest) {
                        rootTokens.push(currentRequest);
                    }
                    currentRequest = this.parseVariable();
                    break;
                case TokenType.METHOD:
                    if (currentRequest) {
                        rootTokens.push(currentRequest);
                    }
                    currentRequest = this.parseRequest();
                    break;

                case TokenType.SEPARATOR:
                    if (currentRequest) {
                        rootTokens.push(currentRequest);
                        currentRequest = null;
                    }
                    rootTokens.push({ type: 'Separator', value: this.tokens[this.current].value });
                    this.current++;
                    while (this.current < this.tokens.length &&
                        this.tokens[this.current].type === TokenType.NEWLINE) {
                        this.current++;
                    }
                    break;

                case TokenType.BODY:
                    if (currentRequest) {
                        currentRequest.body += (currentRequest.body ? '\n' : '') + token.value;
                    }
                    this.current++;
                    break;

                default:
                    this.current++;
                    break;
            }
        }

        if (currentRequest) {
            rootTokens.push(currentRequest);
        }
        return rootTokens;
    }

    parseRequest() {
        const request = {
            type: 'HttpRequest',
            method: '',
            url: '',
            version: '',
            headers: [],
            body: ''
        };


        let complete = false;

        while (this.current < this.tokens.length && !complete) {

            const token = this.tokens[this.current];

            switch (token.type) {
                case TokenType.SEPARATOR:
                    complete = true;
                    break;

                case TokenType.NEWLINE:
                    this.current++;
                    break;

                case TokenType.HEADER_NAME:
                    request.headers.push({ key: token.value, value: this.tokens[this.current + 1].value });
                    this.current += 2;
                    break;

                case TokenType.BODY:
                    request.body += (request.body ? '\n' : '') + token.value;
                    this.current++;
                    break;

                case TokenType.METHOD:
                    request.method = token.value;
                    this.current++;
                    break;

                case TokenType.URL:
                    request.url = token.value;
                    this.current++;
                    break;

                case TokenType.VERSION:
                    request.version = token.value;
                    this.current++;
                    break;

                default:
                    this.current++;
            }
        }


        for (let key of Object.keys(request)) {
            if (request[key] === '__NULL__') {
                request[key] = '';
            }
        }

        return request;
    }
    parseVariable() {
        const request = {
            type: 'Variable',
            name: '',
            operator: '',
            value: '',
        };


        let complete = false;

        while (this.current < this.tokens.length && !complete) {

            const token = this.tokens[this.current];

            switch (token.type) {
                case TokenType.SEPARATOR:
                    complete = true;
                    break;

                case TokenType.NEWLINE:
                    complete = true;
                    break;

                case TokenType.VAR_NAME:
                    request.name = token.value;
                    this.current++;
                    break;

                case TokenType.OPERATOR:
                    request.operator = token.value;
                    this.current++;
                    break;

                case TokenType.VAR_VALUE:
                    request.value = token.value;
                    complete = true;
                    this.current++;
                    break;

                default:
                    this.current++;
            }
        }


        for (let key of Object.keys(request)) {
            if (request[key] === '__NULL__') {
                request[key] = '';
            }
        }
        return request;
    }
}

// Main processing function
function parse(input) {
    const lexer = new HTTPLexer(input);
    const tokens = lexer.lex();  // Changed from tokenize() to lex()
    const parser = new HTTPParser(tokens);
    return parser.parse();
}

function format(text) {
    let ast = parse(text);

    let error = null;
    let res = null;
    try {

        res = ast.map(token => {

            if (token.type === 'Separator') {
                token = { type: 'Separator', value: token.value };
                return token.value;
            } else if (token.type === 'Variable') {
                token = { type: 'Variable', ...token };

                return `${token.name} ${token.operator} ${token.value}`

            } else if (token.type === 'HttpRequest') {
                token = { type: 'HttpRequest', ...token };

                let request = token;

                const { method, url, version, headers, body } = request;

                // Start with the request line
                let formattedRequest = `${method} ${url} ${version}\n`;
                // Add headers
                headers.forEach(header => {
                    formattedRequest += `${header.key}: ${header.value}\n`;
                });

                // Add a blank line before the body, if there's any
                if (body.trim()) {
                    try {
                        formattedRequest += `\n${JSON.stringify(JSON.parse(body), null, 4)}`;
                    } catch (error) {
                        formattedRequest += `\n${body}`;
                    }
                }

                return formattedRequest.trim(); // Trim any unnecessary trailing whitespace
            }
        }).join('\n\n'); // Separate requests by "###" separator

    } catch (e) {
        error = e;
    }

    return [res, error];
}



let input = `

@hostname = api.example.com

@port = 8080

@host = {{hostname}}:{{port}}

@contentType = application/json

@createdAt ={{$datetime iso8601}}

@modifiedBy= {{$processEnv USERNAME}}

### Sample GET request




https://www.example.com/api/v2/user/balance?user=mainuser&site-key=somekey 
X-API-ID: key1
X-API-KEY: key2

### Sample GET request

https://www.example.com/api/v2/user/list?site-key=somekey 
X-API-ID: key1
X-API-KEY: key2

### ?site-key=somekey&user=mainuser&amount=1

POST https://www.example.com/api/v2/user/withdraw?site-key=somekey&user=mainuser&amount=1 
Content-Type: application/json
X-API-ID: key1
X-API-KEY: key2

{
    "site-key": "somekey",
    "user": "anonymous",
    "amount": 1
}

### Sample GET request

GET https://jsonplaceholder.typicode.com/posts/1 
Accept: application/json

###

### Sample POST request

POST https://jsonplaceholder.typicode.com/posts 
Content-Type: application/json

{
    "title": "foo",
    "body": "bar",
    "userId": 1
}

###

### Sample PUT request

PUT https://jsonplaceholder.typicode.com/posts/1 
Content-Type: application/json

{
    "id": 1,
    "title": "foo",
    "body": "bar",
    "userId": 1
}

###

### Sample

DELETE https://jsonplaceholder.typicode.com/posts/1

###

###

`
input = input.trim() + '\n';
input = input.replace(/\r\n/g, '\n');


//// test

const [formatted, error] = format(input);
if (input.replace(/[\s\n\r\t]/g, '') != formatted.replace(/[\s\n\r\t]/g, '')) {
    console.log(formatted);
    console.log('likely corrupted');
} else {

    console.log('OK', formatted);
}


module.exports = {
    parse,
    format
};