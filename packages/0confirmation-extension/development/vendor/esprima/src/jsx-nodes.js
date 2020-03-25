"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_syntax_1 = require("./jsx-syntax");
var JSXClosingElement = /** @class */ (function () {
    function JSXClosingElement(name) {
        this.type = jsx_syntax_1.JSXSyntax.JSXClosingElement;
        this.name = name;
    }
    return JSXClosingElement;
}());
exports.JSXClosingElement = JSXClosingElement;
var JSXElement = /** @class */ (function () {
    function JSXElement(openingElement, children, closingElement) {
        this.type = jsx_syntax_1.JSXSyntax.JSXElement;
        this.openingElement = openingElement;
        this.children = children;
        this.closingElement = closingElement;
    }
    return JSXElement;
}());
exports.JSXElement = JSXElement;
var JSXEmptyExpression = /** @class */ (function () {
    function JSXEmptyExpression() {
        this.type = jsx_syntax_1.JSXSyntax.JSXEmptyExpression;
    }
    return JSXEmptyExpression;
}());
exports.JSXEmptyExpression = JSXEmptyExpression;
var JSXExpressionContainer = /** @class */ (function () {
    function JSXExpressionContainer(expression) {
        this.type = jsx_syntax_1.JSXSyntax.JSXExpressionContainer;
        this.expression = expression;
    }
    return JSXExpressionContainer;
}());
exports.JSXExpressionContainer = JSXExpressionContainer;
var JSXIdentifier = /** @class */ (function () {
    function JSXIdentifier(name) {
        this.type = jsx_syntax_1.JSXSyntax.JSXIdentifier;
        this.name = name;
    }
    return JSXIdentifier;
}());
exports.JSXIdentifier = JSXIdentifier;
var JSXMemberExpression = /** @class */ (function () {
    function JSXMemberExpression(object, property) {
        this.type = jsx_syntax_1.JSXSyntax.JSXMemberExpression;
        this.object = object;
        this.property = property;
    }
    return JSXMemberExpression;
}());
exports.JSXMemberExpression = JSXMemberExpression;
var JSXAttribute = /** @class */ (function () {
    function JSXAttribute(name, value) {
        this.type = jsx_syntax_1.JSXSyntax.JSXAttribute;
        this.name = name;
        this.value = value;
    }
    return JSXAttribute;
}());
exports.JSXAttribute = JSXAttribute;
var JSXNamespacedName = /** @class */ (function () {
    function JSXNamespacedName(namespace, name) {
        this.type = jsx_syntax_1.JSXSyntax.JSXNamespacedName;
        this.namespace = namespace;
        this.name = name;
    }
    return JSXNamespacedName;
}());
exports.JSXNamespacedName = JSXNamespacedName;
var JSXOpeningElement = /** @class */ (function () {
    function JSXOpeningElement(name, selfClosing, attributes) {
        this.type = jsx_syntax_1.JSXSyntax.JSXOpeningElement;
        this.name = name;
        this.selfClosing = selfClosing;
        this.attributes = attributes;
    }
    return JSXOpeningElement;
}());
exports.JSXOpeningElement = JSXOpeningElement;
var JSXSpreadAttribute = /** @class */ (function () {
    function JSXSpreadAttribute(argument) {
        this.type = jsx_syntax_1.JSXSyntax.JSXSpreadAttribute;
        this.argument = argument;
    }
    return JSXSpreadAttribute;
}());
exports.JSXSpreadAttribute = JSXSpreadAttribute;
var JSXText = /** @class */ (function () {
    function JSXText(value, raw) {
        this.type = jsx_syntax_1.JSXSyntax.JSXText;
        this.value = value;
        this.raw = raw;
    }
    return JSXText;
}());
exports.JSXText = JSXText;
