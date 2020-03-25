"use strict";
// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.
Object.defineProperty(exports, "__esModule", { value: true });
function assert(condition, message) {
    /* istanbul ignore if */
    if (!condition) {
        throw new Error('ASSERT: ' + message);
    }
}
exports.assert = assert;
