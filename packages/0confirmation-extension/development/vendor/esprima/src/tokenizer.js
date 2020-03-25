"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var error_handler_1 = require("./error-handler");
var scanner_1 = require("./scanner");
var token_1 = require("./token");
var Reader = /** @class */ (function () {
    function Reader() {
        this.values = [];
        this.curly = this.paren = -1;
    }
    // A function following one of those tokens is an expression.
    Reader.prototype.beforeFunctionExpression = function (t) {
        return ['(', '{', '[', 'in', 'typeof', 'instanceof', 'new',
            'return', 'case', 'delete', 'throw', 'void',
            // assignment operators
            '=', '+=', '-=', '*=', '**=', '/=', '%=', '<<=', '>>=', '>>>=',
            '&=', '|=', '^=', ',',
            // binary/unary operators
            '+', '-', '*', '**', '/', '%', '++', '--', '<<', '>>', '>>>', '&',
            '|', '^', '!', '~', '&&', '||', '?', ':', '===', '==', '>=',
            '<=', '<', '>', '!=', '!=='].indexOf(t) >= 0;
    };
    // Determine if forward slash (/) is an operator or part of a regular expression
    // https://github.com/mozilla/sweet.js/wiki/design
    Reader.prototype.isRegexStart = function () {
        var previous = this.values[this.values.length - 1];
        var regex = (previous !== null);
        switch (previous) {
            case 'this':
            case ']':
                regex = false;
                break;
            case ')':
                var keyword = this.values[this.paren - 1];
                regex = (keyword === 'if' || keyword === 'while' || keyword === 'for' || keyword === 'with');
                break;
            case '}':
                // Dividing a function by anything makes little sense,
                // but we have to check for that.
                regex = true;
                if (this.values[this.curly - 3] === 'function') {
                    // Anonymous function, e.g. function(){} /42
                    var check = this.values[this.curly - 4];
                    regex = check ? !this.beforeFunctionExpression(check) : false;
                }
                else if (this.values[this.curly - 4] === 'function') {
                    // Named function, e.g. function f(){} /42/
                    var check = this.values[this.curly - 5];
                    regex = check ? !this.beforeFunctionExpression(check) : true;
                }
                break;
            default:
                break;
        }
        return regex;
    };
    Reader.prototype.push = function (token) {
        if (token.type === 7 /* Punctuator */ || token.type === 4 /* Keyword */) {
            if (token.value === '{') {
                this.curly = this.values.length;
            }
            else if (token.value === '(') {
                this.paren = this.values.length;
            }
            this.values.push(token.value);
        }
        else {
            this.values.push(null);
        }
    };
    return Reader;
}());
var Tokenizer = /** @class */ (function () {
    function Tokenizer(code, config) {
        this.errorHandler = new error_handler_1.ErrorHandler();
        this.errorHandler.tolerant = config ? (typeof config.tolerant === 'boolean' && config.tolerant) : false;
        this.scanner = new scanner_1.Scanner(code, this.errorHandler);
        this.scanner.trackComment = config ? (typeof config.comment === 'boolean' && config.comment) : false;
        this.trackRange = config ? (typeof config.range === 'boolean' && config.range) : false;
        this.trackLoc = config ? (typeof config.loc === 'boolean' && config.loc) : false;
        this.buffer = [];
        this.reader = new Reader();
    }
    Tokenizer.prototype.errors = function () {
        return this.errorHandler.errors;
    };
    Tokenizer.prototype.getNextToken = function () {
        if (this.buffer.length === 0) {
            var comments = this.scanner.scanComments();
            if (this.scanner.trackComment) {
                for (var i = 0; i < comments.length; ++i) {
                    var e = comments[i];
                    var value = this.scanner.source.slice(e.slice[0], e.slice[1]);
                    var comment = {
                        type: e.multiLine ? 'BlockComment' : 'LineComment',
                        value: value
                    };
                    if (this.trackRange) {
                        comment.range = e.range;
                    }
                    if (this.trackLoc) {
                        comment.loc = e.loc;
                    }
                    this.buffer.push(comment);
                }
            }
            if (!this.scanner.eof()) {
                var loc = void 0;
                if (this.trackLoc) {
                    loc = {
                        start: {
                            line: this.scanner.lineNumber,
                            column: this.scanner.index - this.scanner.lineStart
                        },
                        end: {}
                    };
                }
                var maybeRegex = (this.scanner.source[this.scanner.index] === '/') && this.reader.isRegexStart();
                var token = void 0;
                if (maybeRegex) {
                    var state = this.scanner.saveState();
                    try {
                        token = this.scanner.scanRegExp();
                    }
                    catch (e) {
                        this.scanner.restoreState(state);
                        token = this.scanner.lex();
                    }
                }
                else {
                    token = this.scanner.lex();
                }
                this.reader.push(token);
                var entry = {
                    type: token_1.TokenName[token.type],
                    value: this.scanner.source.slice(token.start, token.end)
                };
                if (this.trackRange) {
                    entry.range = [token.start, token.end];
                }
                if (this.trackLoc) {
                    loc.end = {
                        line: this.scanner.lineNumber,
                        column: this.scanner.index - this.scanner.lineStart
                    };
                    entry.loc = loc;
                }
                if (token.type === 9 /* RegularExpression */) {
                    var pattern = token.pattern;
                    var flags = token.flags;
                    entry.regex = { pattern: pattern, flags: flags };
                }
                this.buffer.push(entry);
            }
        }
        return this.buffer.shift();
    };
    return Tokenizer;
}());
exports.Tokenizer = Tokenizer;
