"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var syntax_1 = require("./syntax");
var ArrayExpression = /** @class */ (function () {
    function ArrayExpression(elements) {
        this.type = syntax_1.Syntax.ArrayExpression;
        this.elements = elements;
    }
    return ArrayExpression;
}());
exports.ArrayExpression = ArrayExpression;
var ArrayPattern = /** @class */ (function () {
    function ArrayPattern(elements) {
        this.type = syntax_1.Syntax.ArrayPattern;
        this.elements = elements;
    }
    return ArrayPattern;
}());
exports.ArrayPattern = ArrayPattern;
var ArrowFunctionExpression = /** @class */ (function () {
    function ArrowFunctionExpression(params, body, expression) {
        this.type = syntax_1.Syntax.ArrowFunctionExpression;
        this.id = null;
        this.params = params;
        this.body = body;
        this.generator = false;
        this.expression = expression;
        this.async = false;
    }
    return ArrowFunctionExpression;
}());
exports.ArrowFunctionExpression = ArrowFunctionExpression;
var AssignmentExpression = /** @class */ (function () {
    function AssignmentExpression(operator, left, right) {
        this.type = syntax_1.Syntax.AssignmentExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    return AssignmentExpression;
}());
exports.AssignmentExpression = AssignmentExpression;
var AssignmentPattern = /** @class */ (function () {
    function AssignmentPattern(left, right) {
        this.type = syntax_1.Syntax.AssignmentPattern;
        this.left = left;
        this.right = right;
    }
    return AssignmentPattern;
}());
exports.AssignmentPattern = AssignmentPattern;
var AsyncArrowFunctionExpression = /** @class */ (function () {
    function AsyncArrowFunctionExpression(params, body, expression) {
        this.type = syntax_1.Syntax.ArrowFunctionExpression;
        this.id = null;
        this.params = params;
        this.body = body;
        this.generator = false;
        this.expression = expression;
        this.async = true;
    }
    return AsyncArrowFunctionExpression;
}());
exports.AsyncArrowFunctionExpression = AsyncArrowFunctionExpression;
var AsyncFunctionDeclaration = /** @class */ (function () {
    function AsyncFunctionDeclaration(id, params, body) {
        this.type = syntax_1.Syntax.FunctionDeclaration;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = false;
        this.expression = false;
        this.async = true;
    }
    return AsyncFunctionDeclaration;
}());
exports.AsyncFunctionDeclaration = AsyncFunctionDeclaration;
var AsyncFunctionExpression = /** @class */ (function () {
    function AsyncFunctionExpression(id, params, body) {
        this.type = syntax_1.Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = false;
        this.expression = false;
        this.async = true;
    }
    return AsyncFunctionExpression;
}());
exports.AsyncFunctionExpression = AsyncFunctionExpression;
var AwaitExpression = /** @class */ (function () {
    function AwaitExpression(argument) {
        this.type = syntax_1.Syntax.AwaitExpression;
        this.argument = argument;
    }
    return AwaitExpression;
}());
exports.AwaitExpression = AwaitExpression;
var BinaryExpression = /** @class */ (function () {
    function BinaryExpression(operator, left, right) {
        var logical = (operator === '||' || operator === '&&');
        this.type = logical ? syntax_1.Syntax.LogicalExpression : syntax_1.Syntax.BinaryExpression;
        this.operator = operator;
        this.left = left;
        this.right = right;
    }
    return BinaryExpression;
}());
exports.BinaryExpression = BinaryExpression;
var BlockStatement = /** @class */ (function () {
    function BlockStatement(body) {
        this.type = syntax_1.Syntax.BlockStatement;
        this.body = body;
    }
    return BlockStatement;
}());
exports.BlockStatement = BlockStatement;
var BreakStatement = /** @class */ (function () {
    function BreakStatement(label) {
        this.type = syntax_1.Syntax.BreakStatement;
        this.label = label;
    }
    return BreakStatement;
}());
exports.BreakStatement = BreakStatement;
var CallExpression = /** @class */ (function () {
    function CallExpression(callee, args) {
        this.type = syntax_1.Syntax.CallExpression;
        this.callee = callee;
        this.arguments = args;
    }
    return CallExpression;
}());
exports.CallExpression = CallExpression;
var CatchClause = /** @class */ (function () {
    function CatchClause(param, body) {
        this.type = syntax_1.Syntax.CatchClause;
        this.param = param;
        this.body = body;
    }
    return CatchClause;
}());
exports.CatchClause = CatchClause;
var ClassBody = /** @class */ (function () {
    function ClassBody(body) {
        this.type = syntax_1.Syntax.ClassBody;
        this.body = body;
    }
    return ClassBody;
}());
exports.ClassBody = ClassBody;
var ClassDeclaration = /** @class */ (function () {
    function ClassDeclaration(id, superClass, body) {
        this.type = syntax_1.Syntax.ClassDeclaration;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
    return ClassDeclaration;
}());
exports.ClassDeclaration = ClassDeclaration;
var ClassExpression = /** @class */ (function () {
    function ClassExpression(id, superClass, body) {
        this.type = syntax_1.Syntax.ClassExpression;
        this.id = id;
        this.superClass = superClass;
        this.body = body;
    }
    return ClassExpression;
}());
exports.ClassExpression = ClassExpression;
var ComputedMemberExpression = /** @class */ (function () {
    function ComputedMemberExpression(object, property) {
        this.type = syntax_1.Syntax.MemberExpression;
        this.computed = true;
        this.object = object;
        this.property = property;
    }
    return ComputedMemberExpression;
}());
exports.ComputedMemberExpression = ComputedMemberExpression;
var ConditionalExpression = /** @class */ (function () {
    function ConditionalExpression(test, consequent, alternate) {
        this.type = syntax_1.Syntax.ConditionalExpression;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
    return ConditionalExpression;
}());
exports.ConditionalExpression = ConditionalExpression;
var ContinueStatement = /** @class */ (function () {
    function ContinueStatement(label) {
        this.type = syntax_1.Syntax.ContinueStatement;
        this.label = label;
    }
    return ContinueStatement;
}());
exports.ContinueStatement = ContinueStatement;
var DebuggerStatement = /** @class */ (function () {
    function DebuggerStatement() {
        this.type = syntax_1.Syntax.DebuggerStatement;
    }
    return DebuggerStatement;
}());
exports.DebuggerStatement = DebuggerStatement;
var Directive = /** @class */ (function () {
    function Directive(expression, directive) {
        this.type = syntax_1.Syntax.ExpressionStatement;
        this.expression = expression;
        this.directive = directive;
    }
    return Directive;
}());
exports.Directive = Directive;
var DoWhileStatement = /** @class */ (function () {
    function DoWhileStatement(body, test) {
        this.type = syntax_1.Syntax.DoWhileStatement;
        this.body = body;
        this.test = test;
    }
    return DoWhileStatement;
}());
exports.DoWhileStatement = DoWhileStatement;
var EmptyStatement = /** @class */ (function () {
    function EmptyStatement() {
        this.type = syntax_1.Syntax.EmptyStatement;
    }
    return EmptyStatement;
}());
exports.EmptyStatement = EmptyStatement;
var ExportAllDeclaration = /** @class */ (function () {
    function ExportAllDeclaration(source) {
        this.type = syntax_1.Syntax.ExportAllDeclaration;
        this.source = source;
    }
    return ExportAllDeclaration;
}());
exports.ExportAllDeclaration = ExportAllDeclaration;
var ExportDefaultDeclaration = /** @class */ (function () {
    function ExportDefaultDeclaration(declaration) {
        this.type = syntax_1.Syntax.ExportDefaultDeclaration;
        this.declaration = declaration;
    }
    return ExportDefaultDeclaration;
}());
exports.ExportDefaultDeclaration = ExportDefaultDeclaration;
var ExportNamedDeclaration = /** @class */ (function () {
    function ExportNamedDeclaration(declaration, specifiers, source) {
        this.type = syntax_1.Syntax.ExportNamedDeclaration;
        this.declaration = declaration;
        this.specifiers = specifiers;
        this.source = source;
    }
    return ExportNamedDeclaration;
}());
exports.ExportNamedDeclaration = ExportNamedDeclaration;
var ExportSpecifier = /** @class */ (function () {
    function ExportSpecifier(local, exported) {
        this.type = syntax_1.Syntax.ExportSpecifier;
        this.exported = exported;
        this.local = local;
    }
    return ExportSpecifier;
}());
exports.ExportSpecifier = ExportSpecifier;
var ExpressionStatement = /** @class */ (function () {
    function ExpressionStatement(expression) {
        this.type = syntax_1.Syntax.ExpressionStatement;
        this.expression = expression;
    }
    return ExpressionStatement;
}());
exports.ExpressionStatement = ExpressionStatement;
var ForInStatement = /** @class */ (function () {
    function ForInStatement(left, right, body) {
        this.type = syntax_1.Syntax.ForInStatement;
        this.left = left;
        this.right = right;
        this.body = body;
        this.each = false;
    }
    return ForInStatement;
}());
exports.ForInStatement = ForInStatement;
var ForOfStatement = /** @class */ (function () {
    function ForOfStatement(left, right, body) {
        this.type = syntax_1.Syntax.ForOfStatement;
        this.left = left;
        this.right = right;
        this.body = body;
    }
    return ForOfStatement;
}());
exports.ForOfStatement = ForOfStatement;
var ForStatement = /** @class */ (function () {
    function ForStatement(init, test, update, body) {
        this.type = syntax_1.Syntax.ForStatement;
        this.init = init;
        this.test = test;
        this.update = update;
        this.body = body;
    }
    return ForStatement;
}());
exports.ForStatement = ForStatement;
var FunctionDeclaration = /** @class */ (function () {
    function FunctionDeclaration(id, params, body, generator) {
        this.type = syntax_1.Syntax.FunctionDeclaration;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = generator;
        this.expression = false;
        this.async = false;
    }
    return FunctionDeclaration;
}());
exports.FunctionDeclaration = FunctionDeclaration;
var FunctionExpression = /** @class */ (function () {
    function FunctionExpression(id, params, body, generator) {
        this.type = syntax_1.Syntax.FunctionExpression;
        this.id = id;
        this.params = params;
        this.body = body;
        this.generator = generator;
        this.expression = false;
        this.async = false;
    }
    return FunctionExpression;
}());
exports.FunctionExpression = FunctionExpression;
var Identifier = /** @class */ (function () {
    function Identifier(name) {
        this.type = syntax_1.Syntax.Identifier;
        this.name = name;
    }
    return Identifier;
}());
exports.Identifier = Identifier;
var IfStatement = /** @class */ (function () {
    function IfStatement(test, consequent, alternate) {
        this.type = syntax_1.Syntax.IfStatement;
        this.test = test;
        this.consequent = consequent;
        this.alternate = alternate;
    }
    return IfStatement;
}());
exports.IfStatement = IfStatement;
var Import = /** @class */ (function () {
    function Import() {
        this.type = syntax_1.Syntax.Import;
    }
    return Import;
}());
exports.Import = Import;
var ImportDeclaration = /** @class */ (function () {
    function ImportDeclaration(specifiers, source) {
        this.type = syntax_1.Syntax.ImportDeclaration;
        this.specifiers = specifiers;
        this.source = source;
    }
    return ImportDeclaration;
}());
exports.ImportDeclaration = ImportDeclaration;
var ImportDefaultSpecifier = /** @class */ (function () {
    function ImportDefaultSpecifier(local) {
        this.type = syntax_1.Syntax.ImportDefaultSpecifier;
        this.local = local;
    }
    return ImportDefaultSpecifier;
}());
exports.ImportDefaultSpecifier = ImportDefaultSpecifier;
var ImportNamespaceSpecifier = /** @class */ (function () {
    function ImportNamespaceSpecifier(local) {
        this.type = syntax_1.Syntax.ImportNamespaceSpecifier;
        this.local = local;
    }
    return ImportNamespaceSpecifier;
}());
exports.ImportNamespaceSpecifier = ImportNamespaceSpecifier;
var ImportSpecifier = /** @class */ (function () {
    function ImportSpecifier(local, imported) {
        this.type = syntax_1.Syntax.ImportSpecifier;
        this.local = local;
        this.imported = imported;
    }
    return ImportSpecifier;
}());
exports.ImportSpecifier = ImportSpecifier;
var LabeledStatement = /** @class */ (function () {
    function LabeledStatement(label, body) {
        this.type = syntax_1.Syntax.LabeledStatement;
        this.label = label;
        this.body = body;
    }
    return LabeledStatement;
}());
exports.LabeledStatement = LabeledStatement;
var Literal = /** @class */ (function () {
    function Literal(value, raw) {
        this.type = syntax_1.Syntax.Literal;
        this.value = value;
        this.raw = raw;
    }
    return Literal;
}());
exports.Literal = Literal;
var MetaProperty = /** @class */ (function () {
    function MetaProperty(meta, property) {
        this.type = syntax_1.Syntax.MetaProperty;
        this.meta = meta;
        this.property = property;
    }
    return MetaProperty;
}());
exports.MetaProperty = MetaProperty;
var MethodDefinition = /** @class */ (function () {
    function MethodDefinition(key, computed, value, kind, isStatic) {
        this.type = syntax_1.Syntax.MethodDefinition;
        this.key = key;
        this.computed = computed;
        this.value = value;
        this.kind = kind;
        this.static = isStatic;
    }
    return MethodDefinition;
}());
exports.MethodDefinition = MethodDefinition;
var Module = /** @class */ (function () {
    function Module(body) {
        this.type = syntax_1.Syntax.Program;
        this.body = body;
        this.sourceType = 'module';
    }
    return Module;
}());
exports.Module = Module;
var NewExpression = /** @class */ (function () {
    function NewExpression(callee, args) {
        this.type = syntax_1.Syntax.NewExpression;
        this.callee = callee;
        this.arguments = args;
    }
    return NewExpression;
}());
exports.NewExpression = NewExpression;
var ObjectExpression = /** @class */ (function () {
    function ObjectExpression(properties) {
        this.type = syntax_1.Syntax.ObjectExpression;
        this.properties = properties;
    }
    return ObjectExpression;
}());
exports.ObjectExpression = ObjectExpression;
var ObjectPattern = /** @class */ (function () {
    function ObjectPattern(properties) {
        this.type = syntax_1.Syntax.ObjectPattern;
        this.properties = properties;
    }
    return ObjectPattern;
}());
exports.ObjectPattern = ObjectPattern;
var Property = /** @class */ (function () {
    function Property(kind, key, computed, value, method, shorthand) {
        this.type = syntax_1.Syntax.Property;
        this.key = key;
        this.computed = computed;
        this.value = value;
        this.kind = kind;
        this.method = method;
        this.shorthand = shorthand;
    }
    return Property;
}());
exports.Property = Property;
var RegexLiteral = /** @class */ (function () {
    function RegexLiteral(value, raw, pattern, flags) {
        this.type = syntax_1.Syntax.Literal;
        this.value = value;
        this.raw = raw;
        this.regex = { pattern: pattern, flags: flags };
    }
    return RegexLiteral;
}());
exports.RegexLiteral = RegexLiteral;
var RestElement = /** @class */ (function () {
    function RestElement(argument) {
        this.type = syntax_1.Syntax.RestElement;
        this.argument = argument;
    }
    return RestElement;
}());
exports.RestElement = RestElement;
var ReturnStatement = /** @class */ (function () {
    function ReturnStatement(argument) {
        this.type = syntax_1.Syntax.ReturnStatement;
        this.argument = argument;
    }
    return ReturnStatement;
}());
exports.ReturnStatement = ReturnStatement;
var Script = /** @class */ (function () {
    function Script(body) {
        this.type = syntax_1.Syntax.Program;
        this.body = body;
        this.sourceType = 'script';
    }
    return Script;
}());
exports.Script = Script;
var SequenceExpression = /** @class */ (function () {
    function SequenceExpression(expressions) {
        this.type = syntax_1.Syntax.SequenceExpression;
        this.expressions = expressions;
    }
    return SequenceExpression;
}());
exports.SequenceExpression = SequenceExpression;
var SpreadElement = /** @class */ (function () {
    function SpreadElement(argument) {
        this.type = syntax_1.Syntax.SpreadElement;
        this.argument = argument;
    }
    return SpreadElement;
}());
exports.SpreadElement = SpreadElement;
var StaticMemberExpression = /** @class */ (function () {
    function StaticMemberExpression(object, property) {
        this.type = syntax_1.Syntax.MemberExpression;
        this.computed = false;
        this.object = object;
        this.property = property;
    }
    return StaticMemberExpression;
}());
exports.StaticMemberExpression = StaticMemberExpression;
var Super = /** @class */ (function () {
    function Super() {
        this.type = syntax_1.Syntax.Super;
    }
    return Super;
}());
exports.Super = Super;
var SwitchCase = /** @class */ (function () {
    function SwitchCase(test, consequent) {
        this.type = syntax_1.Syntax.SwitchCase;
        this.test = test;
        this.consequent = consequent;
    }
    return SwitchCase;
}());
exports.SwitchCase = SwitchCase;
var SwitchStatement = /** @class */ (function () {
    function SwitchStatement(discriminant, cases) {
        this.type = syntax_1.Syntax.SwitchStatement;
        this.discriminant = discriminant;
        this.cases = cases;
    }
    return SwitchStatement;
}());
exports.SwitchStatement = SwitchStatement;
var TaggedTemplateExpression = /** @class */ (function () {
    function TaggedTemplateExpression(tag, quasi) {
        this.type = syntax_1.Syntax.TaggedTemplateExpression;
        this.tag = tag;
        this.quasi = quasi;
    }
    return TaggedTemplateExpression;
}());
exports.TaggedTemplateExpression = TaggedTemplateExpression;
var TemplateElement = /** @class */ (function () {
    function TemplateElement(value, tail) {
        this.type = syntax_1.Syntax.TemplateElement;
        this.value = value;
        this.tail = tail;
    }
    return TemplateElement;
}());
exports.TemplateElement = TemplateElement;
var TemplateLiteral = /** @class */ (function () {
    function TemplateLiteral(quasis, expressions) {
        this.type = syntax_1.Syntax.TemplateLiteral;
        this.quasis = quasis;
        this.expressions = expressions;
    }
    return TemplateLiteral;
}());
exports.TemplateLiteral = TemplateLiteral;
var ThisExpression = /** @class */ (function () {
    function ThisExpression() {
        this.type = syntax_1.Syntax.ThisExpression;
    }
    return ThisExpression;
}());
exports.ThisExpression = ThisExpression;
var ThrowStatement = /** @class */ (function () {
    function ThrowStatement(argument) {
        this.type = syntax_1.Syntax.ThrowStatement;
        this.argument = argument;
    }
    return ThrowStatement;
}());
exports.ThrowStatement = ThrowStatement;
var TryStatement = /** @class */ (function () {
    function TryStatement(block, handler, finalizer) {
        this.type = syntax_1.Syntax.TryStatement;
        this.block = block;
        this.handler = handler;
        this.finalizer = finalizer;
    }
    return TryStatement;
}());
exports.TryStatement = TryStatement;
var UnaryExpression = /** @class */ (function () {
    function UnaryExpression(operator, argument) {
        this.type = syntax_1.Syntax.UnaryExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = true;
    }
    return UnaryExpression;
}());
exports.UnaryExpression = UnaryExpression;
var UpdateExpression = /** @class */ (function () {
    function UpdateExpression(operator, argument, prefix) {
        this.type = syntax_1.Syntax.UpdateExpression;
        this.operator = operator;
        this.argument = argument;
        this.prefix = prefix;
    }
    return UpdateExpression;
}());
exports.UpdateExpression = UpdateExpression;
var VariableDeclaration = /** @class */ (function () {
    function VariableDeclaration(declarations, kind) {
        this.type = syntax_1.Syntax.VariableDeclaration;
        this.declarations = declarations;
        this.kind = kind;
    }
    return VariableDeclaration;
}());
exports.VariableDeclaration = VariableDeclaration;
var VariableDeclarator = /** @class */ (function () {
    function VariableDeclarator(id, init) {
        this.type = syntax_1.Syntax.VariableDeclarator;
        this.id = id;
        this.init = init;
    }
    return VariableDeclarator;
}());
exports.VariableDeclarator = VariableDeclarator;
var WhileStatement = /** @class */ (function () {
    function WhileStatement(test, body) {
        this.type = syntax_1.Syntax.WhileStatement;
        this.test = test;
        this.body = body;
    }
    return WhileStatement;
}());
exports.WhileStatement = WhileStatement;
var WithStatement = /** @class */ (function () {
    function WithStatement(object, body) {
        this.type = syntax_1.Syntax.WithStatement;
        this.object = object;
        this.body = body;
    }
    return WithStatement;
}());
exports.WithStatement = WithStatement;
var YieldExpression = /** @class */ (function () {
    function YieldExpression(argument, delegate) {
        this.type = syntax_1.Syntax.YieldExpression;
        this.argument = argument;
        this.delegate = delegate;
    }
    return YieldExpression;
}());
exports.YieldExpression = YieldExpression;
