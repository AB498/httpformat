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
    COMMENT: 'COMMENT',
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
    COMMENT: 'COMMENT',
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

                case LexerState.COMMENT:
                    this.handleCommentState(char);
                    break;
            }

            this.advance();
        }

        // Handle end of input - emit any remaining tokens
        if (this.currentToken) {
            switch (this.state) {
                case LexerState.URL:
                    this.emitToken(TokenType.URL);
                    break;
                case LexerState.VERSION:
                    this.emitToken(TokenType.VERSION);
                    break;
                case LexerState.VAR_VALUE:
                    this.emitToken(TokenType.VAR_VALUE);
                    break;
                case LexerState.COMMENT:
                    this.emitToken(TokenType.COMMENT);
                    break;
                case LexerState.BODY:
                    this.emitToken(TokenType.BODY);
                    break;
                default:
                    this.emitCurrentToken();
                    break;
            }
        }

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
            // Check if this is a separator (###) or a comment (#)
            if (this.input.slice(this.pos, this.pos + 3) === '###') {
                this.state = LexerState.SEPARATOR;
                this.currentToken = char;
            } else {
                this.state = LexerState.COMMENT;
                this.currentToken = char;
            }
        } else if (char === '/' && this.input.slice(this.pos, this.pos + 2) === '//') {
            // Handle double slash comments
            this.state = LexerState.COMMENT;
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
        } else if (char === '#') {
            // Check if this is a separator (###)
            if (this.input.slice(this.pos, this.pos + 3) === '###') {
                this.state = LexerState.SEPARATOR;
                this.currentToken = char;
                return;
            } else {
                this.currentToken += char;
            }
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

    handleCommentState(char) {
        if (char === '\n') {
            this.emitToken(TokenType.COMMENT);
            this.state = LexerState.START;
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

                case TokenType.COMMENT:
                    if (currentRequest) {
                        rootTokens.push(currentRequest);
                        currentRequest = null;
                    }
                    rootTokens.push({ type: 'Comment', value: this.tokens[this.current].value });
                    this.current++;
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
        // Process tokens and group them intelligently
        let formattedParts = [];
        let currentGroup = [];
        let currentGroupType = null;

        for (let i = 0; i < ast.length; i++) {
            const token = ast[i];

            if (token.type === 'Separator') {
                // Flush current group before separator
                if (currentGroup.length > 0) {
                    formattedParts.push(currentGroup.join('\n'));
                    currentGroup = [];
                    currentGroupType = null;
                }
                // Add separator
                formattedParts.push(token.value);
            } else if (token.type === 'Comment') {
                // Format comment by cleaning up internal whitespace
                let formattedComment = token.value;

                // Handle special comment patterns like "# @name    value" or "// @prompt    value"
                if (formattedComment.includes('@name') || formattedComment.includes('@prompt')) {
                    // Replace multiple spaces with single space, but preserve the comment prefix
                    formattedComment = formattedComment.replace(/\s+/g, ' ').trim();
                }

                // Comments can be grouped with variables or other comments
                if (currentGroupType === null || currentGroupType === 'Comment' || currentGroupType === 'Variable') {
                    currentGroup.push(formattedComment);
                    currentGroupType = 'Comment';
                } else {
                    // Different type, flush current group and start new one
                    if (currentGroup.length > 0) {
                        formattedParts.push(currentGroup.join('\n'));
                    }
                    currentGroup = [formattedComment];
                    currentGroupType = 'Comment';
                }
            } else if (token.type === 'Variable') {
                const formattedVariable = `${token.name} ${token.operator} ${token.value}`;

                // Variables can be grouped with comments or other variables
                if (currentGroupType === null || currentGroupType === 'Variable' || currentGroupType === 'Comment') {
                    currentGroup.push(formattedVariable);
                    currentGroupType = 'Variable';
                } else {
                    // Different type, flush current group and start new one
                    if (currentGroup.length > 0) {
                        formattedParts.push(currentGroup.join('\n'));
                    }
                    currentGroup = [formattedVariable];
                    currentGroupType = 'Variable';
                }
            } else if (token.type === 'HttpRequest') {
                // Flush current group before HTTP request
                if (currentGroup.length > 0) {
                    formattedParts.push(currentGroup.join('\n'));
                    currentGroup = [];
                    currentGroupType = null;
                }

                const { method, url, version, headers, body } = token;

                // Start with the request line
                let formattedRequest = version ? `${method} ${url} ${version}\n` : `${method} ${url}\n`;
                // Add headers
                headers.forEach(header => {
                    // Clean up extra spaces in header values
                    const cleanValue = header.value.replace(/\s+/g, ' ').trim();
                    formattedRequest += `${header.key}: ${cleanValue}\n`;
                });

                // Add a blank line before the body, if there's any
                if (body.trim()) {
                    try {
                        formattedRequest += `\n${JSON.stringify(JSON.parse(body), null, 4)}`;
                    } catch (error) {
                        formattedRequest += `\n${body}`;
                    }
                }

                formattedParts.push(formattedRequest.trim());
            }
        }

        // Flush any remaining group
        if (currentGroup.length > 0) {
            formattedParts.push(currentGroup.join('\n'));
        }

        // Join parts with double newlines only between major sections
        res = formattedParts.join('\n\n');

    } catch (e) {
        error = e;
    }

    return [res, error];
}





module.exports = {
    parse,
    format
};