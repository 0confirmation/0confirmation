"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ErrorHandler = /** @class */ (function () {
    function ErrorHandler() {
        this.errors = [];
        this.tolerant = false;
    }
    ErrorHandler.prototype.recordError = function (error) {
        this.errors.push(error);
    };
    ErrorHandler.prototype.tolerate = function (error) {
        if (this.tolerant) {
            this.recordError(error);
        }
        else {
            throw error;
        }
    };
    ErrorHandler.prototype.constructError = function (msg, column) {
        var error = new Error(msg);
        try {
            throw error;
        }
        catch (base) {
            /* istanbul ignore else */
            if (Object.create && Object.defineProperty) {
                error = Object.create(base);
                Object.defineProperty(error, 'column', { value: column });
            }
        }
        /* istanbul ignore next */
        return error;
    };
    ErrorHandler.prototype.createError = function (index, line, col, description) {
        var msg = 'Line ' + line + ': ' + description;
        var error = this.constructError(msg, col);
        error.index = index;
        error.lineNumber = line;
        error.description = description;
        return error;
    };
    ErrorHandler.prototype.throwError = function (index, line, col, description) {
        throw this.createError(index, line, col, description);
    };
    ErrorHandler.prototype.tolerateError = function (index, line, col, description) {
        var error = this.createError(index, line, col, description);
        if (this.tolerant) {
            this.recordError(error);
        }
        else {
            throw error;
        }
    };
    return ErrorHandler;
}());
exports.ErrorHandler = ErrorHandler;
