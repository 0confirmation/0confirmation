"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("./syntax");
var CommentHandler = /** @class */ (function () {
    function CommentHandler() {
        this.attach = false;
        this.comments = [];
        this.stack = [];
        this.leading = [];
        this.trailing = [];
    }
    CommentHandler.prototype.insertInnerComments = function (node, metadata) {
        //  innnerComments for properties empty block
        //  `function a() {/** comments **\/}`
        if (node.type === syntax_1.Syntax.BlockStatement && node.body.length === 0) {
            var innerComments = [];
            for (var i = this.leading.length - 1; i >= 0; --i) {
                var entry = this.leading[i];
                if (metadata.end.offset >= entry.start) {
                    innerComments.unshift(entry.comment);
                    this.leading.splice(i, 1);
                    this.trailing.splice(i, 1);
                }
            }
            if (innerComments.length) {
                node.innerComments = innerComments;
            }
        }
    };
    CommentHandler.prototype.findTrailingComments = function (metadata) {
        var trailingComments = [];
        if (this.trailing.length > 0) {
            for (var i = this.trailing.length - 1; i >= 0; --i) {
                var entry = this.trailing[i];
                if (entry.start >= metadata.end.offset) {
                    trailingComments.unshift(entry.comment);
                }
            }
            this.trailing.length = 0;
            return trailingComments;
        }
        var last = this.stack[this.stack.length - 1];
        if (last && last.node.trailingComments) {
            var firstComment = last.node.trailingComments[0];
            if (firstComment && firstComment.range[0] >= metadata.end.offset) {
                trailingComments = last.node.trailingComments;
                delete last.node.trailingComments;
            }
        }
        return trailingComments;
    };
    CommentHandler.prototype.findLeadingComments = function (metadata) {
        var leadingComments = [];
        var target;
        while (this.stack.length > 0) {
            var entry = this.stack[this.stack.length - 1];
            if (entry && entry.start >= metadata.start.offset) {
                target = entry.node;
                this.stack.pop();
            }
            else {
                break;
            }
        }
        if (target) {
            var count = target.leadingComments ? target.leadingComments.length : 0;
            for (var i = count - 1; i >= 0; --i) {
                var comment = target.leadingComments[i];
                if (comment.range[1] <= metadata.start.offset) {
                    leadingComments.unshift(comment);
                    target.leadingComments.splice(i, 1);
                }
            }
            if (target.leadingComments && target.leadingComments.length === 0) {
                delete target.leadingComments;
            }
            return leadingComments;
        }
        for (var i = this.leading.length - 1; i >= 0; --i) {
            var entry = this.leading[i];
            if (entry.start <= metadata.start.offset) {
                leadingComments.unshift(entry.comment);
                this.leading.splice(i, 1);
            }
        }
        return leadingComments;
    };
    CommentHandler.prototype.visitNode = function (node, metadata) {
        if (node.type === syntax_1.Syntax.Program && node.body.length > 0) {
            return;
        }
        this.insertInnerComments(node, metadata);
        var trailingComments = this.findTrailingComments(metadata);
        var leadingComments = this.findLeadingComments(metadata);
        if (leadingComments.length > 0) {
            node.leadingComments = leadingComments;
        }
        if (trailingComments.length > 0) {
            node.trailingComments = trailingComments;
        }
        this.stack.push({
            node: node,
            start: metadata.start.offset
        });
    };
    CommentHandler.prototype.visitComment = function (node, metadata) {
        var type = (node.type[0] === 'L') ? 'Line' : 'Block';
        var comment = {
            type: type,
            value: node.value
        };
        if (node.range) {
            comment.range = node.range;
        }
        if (node.loc) {
            comment.loc = node.loc;
        }
        this.comments.push(comment);
        if (this.attach) {
            var entry = {
                comment: {
                    type: type,
                    value: node.value,
                    range: [metadata.start.offset, metadata.end.offset]
                },
                start: metadata.start.offset
            };
            if (node.loc) {
                entry.comment.loc = node.loc;
            }
            node.type = type;
            this.leading.push(entry);
            this.trailing.push(entry);
        }
    };
    CommentHandler.prototype.visit = function (node, metadata) {
        if (node.type === 'LineComment') {
            this.visitComment(node, metadata);
        }
        else if (node.type === 'BlockComment') {
            this.visitComment(node, metadata);
        }
        else if (this.attach) {
            this.visitNode(node, metadata);
        }
    };
    return CommentHandler;
}());
exports.CommentHandler = CommentHandler;
