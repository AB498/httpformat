// Lexer states
const LexerState = {
    START: 'START',
    METHOD: 'METHOD',
    URL: 'URL',
    VERSION: 'VERSION',
    HEADER_NAME: 'HEADER_NAME',
    HEADER_VALUE: 'HEADER_VALUE',
    BODY: 'BODY',
    SEPARATOR: 'SEPARATOR'
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
    SEPARATOR: 'SEPARATOR'
};

class HTTPLexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.state = LexerState.START;
        this.tokens = [];
        this.currentToken = '';
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
        if (this.isWhitespace(char) || char === '\n') {
            return;
        }
        if (char === '#') {
            this.state = LexerState.SEPARATOR;
            this.currentToken = char;
        } else {
            this.state = LexerState.METHOD;
            this.currentToken = char;
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
        if (char === ':') {
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
        console.log(type, this.currentToken);
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
    }

    parse() {
        const requests = [];
        let currentRequest = null;

        while (this.current < this.tokens.length) {

            const token = this.tokens[this.current];

            switch (token.type) {
                case TokenType.METHOD:
                    if (currentRequest) {
                        requests.push(currentRequest);
                    }
                    currentRequest = this.parseRequest();
                    break;

                case TokenType.SEPARATOR:
                    if (currentRequest) {
                        requests.push(currentRequest);
                        currentRequest = null;
                    }
                    requests.push({ type: 'Separator', value: this.tokens[this.current].value });
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
            requests.push(currentRequest);
        }

        return requests;
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

        // Parse method
        request.method = this.tokens[this.current].value;
        this.current++;

        // Parse URL
        while (this.current < this.tokens.length) {
            const token = this.tokens[this.current];
            if (token.type === TokenType.URL) {
                request.url = token.value;
                this.current++;
                break;
            }
            this.current++;
        }

        // Parse version
        while (this.current < this.tokens.length) {
            const token = this.tokens[this.current];
            if (token.type === TokenType.VERSION) {
                request.version = token.value;
                this.current++;
                break;
            }
            this.current++;
        }

        // Parse headers
        while (this.current < this.tokens.length) {
            const token = this.tokens[this.current];

            if (token.type === TokenType.SEPARATOR) {
                break;
            }

            if (token.type === TokenType.HEADER_NAME) {
                const header = {
                    key: token.value,
                    value: ''
                };

                this.current++;
                while (this.current < this.tokens.length) {
                    const valueToken = this.tokens[this.current];
                    if (valueToken.type === TokenType.HEADER_VALUE) {
                        header.value = valueToken.value;
                        request.headers.push(header);
                        break;
                    }
                    this.current++;
                }
            } else if (token.type === TokenType.BODY) {
                request.body = token.value;
            }

            this.current++;
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

function format(ast) {
    return ast.map(token => {

        if (token.type === 'Separator') {
            token = { type: 'Separator', value: token.value };
            return token.value;
        } else if (token.type === 'HttpRequest') {
            token = { type: 'HttpRequest', ...token };
        }

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
            formattedRequest += `\n${JSON.stringify(JSON.parse(body), null, 4)}`;
        }

        return formattedRequest.trim(); // Trim any unnecessary trailing whitespace
    }).join('\n\n'); // Separate requests by "###" separator
}



// Test the parser
const input = `
GET https://example.com/ HTTP/1.1
Host: example.com
User-Agent: curl/7.68.0

##### dsad

POST https://example.com/upload HTTP/1.1
Content-Type: application/json
Authorization: Bearer some_token

{
                "file": "image.png"
}
`;

const ast = parse(input);
const formatted = format(ast);
console.log(formatted);


module.exports = {
    parse,
    format
};