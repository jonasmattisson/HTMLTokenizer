var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Token = (function () {
    function Token() {
    }
    return Token;
})();
var EOFToken = (function (_super) {
    __extends(EOFToken, _super);
    function EOFToken() {
        _super.apply(this, arguments);
    }
    return EOFToken;
})(Token);
var CharacterToken = (function (_super) {
    __extends(CharacterToken, _super);
    function CharacterToken(character) {
        _super.call(this);
        this.character = character;
    }
    return CharacterToken;
})(Token);
var TagToken = (function (_super) {
    __extends(TagToken, _super);
    function TagToken(tagName) {
        _super.call(this);
        this.attributes = [];
        this.selfClosing = false;
        this.currentAttribute = null;
        this.tagName = tagName;
    }
    TagToken.prototype.addAttribute = function (attribute) {
        this.currentAttribute = attribute;
        this.attributes.push(attribute);
    };
    return TagToken;
})(Token);
var StartTagToken = (function (_super) {
    __extends(StartTagToken, _super);
    function StartTagToken(tagName) {
        _super.call(this, tagName);
    }
    return StartTagToken;
})(TagToken);
var EndTagToken = (function (_super) {
    __extends(EndTagToken, _super);
    function EndTagToken(tagName) {
        _super.call(this, tagName);
    }
    return EndTagToken;
})(TagToken);
var TokenizerStates;
(function (TokenizerStates) {
    TokenizerStates[TokenizerStates["dataState"] = 0] = "dataState";
    TokenizerStates[TokenizerStates["tagOpen"] = 1] = "tagOpen";
    TokenizerStates[TokenizerStates["endTagOpen"] = 2] = "endTagOpen";
    TokenizerStates[TokenizerStates["tagName"] = 3] = "tagName";
    TokenizerStates[TokenizerStates["beforeAttributeName"] = 4] = "beforeAttributeName";
    TokenizerStates[TokenizerStates["selfClosingTag"] = 5] = "selfClosingTag";
    TokenizerStates[TokenizerStates["attributeName"] = 6] = "attributeName";
    TokenizerStates[TokenizerStates["afterAttributeName"] = 7] = "afterAttributeName";
    TokenizerStates[TokenizerStates["beforeAttributeValue"] = 8] = "beforeAttributeValue";
    TokenizerStates[TokenizerStates["attributeValueDoubleQuoted"] = 9] = "attributeValueDoubleQuoted";
    TokenizerStates[TokenizerStates["attributeValueSingleQuoted"] = 10] = "attributeValueSingleQuoted";
    TokenizerStates[TokenizerStates["attributeValueUnquoted"] = 11] = "attributeValueUnquoted";
    TokenizerStates[TokenizerStates["afterAttributeValueQuoted"] = 12] = "afterAttributeValueQuoted";
})(TokenizerStates || (TokenizerStates = {}));
;
var Tokenizer = (function () {
    function Tokenizer(charArray) {
        this.charArray = charArray;
        this.state = 0 /* dataState */;
        this.done = false;
        this.currentCharacterIndex = -1;
        this.tokens = [];
    }
    Tokenizer.prototype.getTokens = function () {
        return this.stateMachine();
    };
    Tokenizer.prototype.stateMachine = function () {
        var maxLoops = 1000;
        var i = 0;
        while (!(this.tokens[this.tokens.length - 1] instanceof EOFToken) && i < maxLoops) {
            switch (this.state) {
                case 0 /* dataState */:
                    this.dataState();
                    break;
                case 1 /* tagOpen */:
                    this.tagOpenState();
                    break;
                case 2 /* endTagOpen */:
                    this.endTagOpenState();
                    break;
                case 3 /* tagName */:
                    this.tagNameState();
                    break;
                case 4 /* beforeAttributeName */:
                    this.beforeAttributeNameState();
                    break;
                case 5 /* selfClosingTag */:
                    this.selfClosingTagState();
                    break;
                case 6 /* attributeName */:
                    this.attributeNameState();
                    break;
                case 7 /* afterAttributeName */:
                    this.afterAttributeNameState();
                    break;
                case 8 /* beforeAttributeValue */:
                    this.beforeAttributeValueState();
                    break;
                case 9 /* attributeValueDoubleQuoted */:
                    this.attributeValueDoubleQuotedState();
                    break;
                case 10 /* attributeValueSingleQuoted */:
                    this.attributeValueSingleQuotedState();
                    break;
                case 11 /* attributeValueUnquoted */:
                    this.attributeValueUnquotedState();
                    break;
                case 12 /* afterAttributeValueQuoted */:
                    this.afterAttributeValueQuotedState();
                    break;
                default:
                    this.done = true;
                    break;
            }
            i += 1;
        }
        return this.tokens;
    };
    Tokenizer.prototype.dataState = function () {
        this.readNextCharacter();
        switch (this.currentCharacter) {
            case '<':
                this.state = 1 /* tagOpen */;
                break;
            case 'EOF':
                this.emitToken(new EOFToken());
                break;
            default:
                this.emitToken(new CharacterToken(this.currentCharacter));
                break;
        }
    };
    Tokenizer.prototype.tagOpenState = function () {
        this.readNextCharacter();
        if (this.currentCharacter === '/') {
            this.state = 2 /* endTagOpen */;
        }
        else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new StartTagToken(this.currentCharacter.toLowerCase());
            this.state = 3 /* tagName */;
        }
        else if (Tokenizer.LOWERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new StartTagToken(this.currentCharacter);
            this.state = 3 /* tagName */;
        }
        else {
            throw 'Parse error. Emit a U+003C LESS-THAN SIGN character token and reconsume the current input character in the data state.';
        }
    };
    Tokenizer.prototype.endTagOpenState = function () {
        this.readNextCharacter();
        if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new EndTagToken(this.currentCharacter.toLowerCase());
            this.state = 3 /* tagName */;
        }
        else if (Tokenizer.LOWERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new EndTagToken(this.currentCharacter);
            this.state = 3 /* tagName */;
        }
        else {
            throw 'Parse error. End Tag Open state';
        }
    };
    Tokenizer.prototype.tagNameState = function () {
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            ;
            this.state = 4 /* beforeAttributeName */;
        }
        else if (this.currentCharacter === '/') {
            this.state = 5 /* selfClosingTag */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken.tagName += this.currentCharacter;
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. Tag name state';
        }
        else {
            this.currentToken.tagName += this.currentCharacter;
        }
    };
    Tokenizer.prototype.beforeAttributeNameState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            ;
        }
        else if (this.currentCharacter === '/') {
            this.state = 5 /* selfClosingTag */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.addAttribute({ name: this.currentCharacter.toLowerCase(), value: '' });
            this.state = 6 /* attributeName */;
        }
        else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '=' || this.currentCharacter === '<') {
            throw 'Parse error. beforeAttributeNameState';
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. beforeAttributeNameState';
        }
        else {
            token.addAttribute({ name: this.currentCharacter, value: '' });
            this.state = 6 /* attributeName */;
        }
    };
    Tokenizer.prototype.attributeNameState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            ;
            this.state = 7 /* afterAttributeName */;
        }
        else if (this.currentCharacter === '/') {
            this.state = 5 /* selfClosingTag */;
        }
        else if (this.currentCharacter === '=') {
            this.state = 8 /* beforeAttributeValue */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.currentAttribute.name += this.currentCharacter.toLowerCase();
        }
        else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<') {
            throw 'Parse error. attributeNameState';
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeNameState';
        }
        else {
            token.currentAttribute.name += this.currentCharacter;
        }
    };
    Tokenizer.prototype.afterAttributeNameState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            ;
        }
        else if (this.currentCharacter === '/') {
            this.state = 5 /* selfClosingTag */;
        }
        else if (this.currentCharacter === '=') {
            this.state = 8 /* beforeAttributeValue */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.addAttribute({ name: this.currentCharacter.toLowerCase(), value: '' });
            this.state = 6 /* attributeName */;
        }
        else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<') {
            throw 'Parse error. afterAttributeNameState';
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. afterAttributeNameState';
        }
        else {
            token.addAttribute({ name: this.currentCharacter, value: '' });
            this.state = 6 /* attributeName */;
        }
    };
    Tokenizer.prototype.beforeAttributeValueState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
        }
        else if (this.currentCharacter === '"') {
            this.state = 9 /* attributeValueDoubleQuoted */;
        }
        else if (this.currentCharacter === '&') {
            this.state = 11 /* attributeValueUnquoted */;
            this.currentCharacterIndex -= 1;
        }
        else if (this.currentCharacter === '\'') {
            this.state = 10 /* attributeValueSingleQuoted */;
        }
        else if (this.currentCharacter === '>') {
            throw 'Parse error. beforeAttributeValueState';
        }
        else if (this.currentCharacter === '<' || this.currentCharacter === '=' || this.currentCharacter === '`') {
            throw 'Parse error. beforeAttributeValueState';
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. beforeAttributeValueState';
        }
        else {
            token.currentAttribute.value += this.currentCharacter;
            this.state = 11 /* attributeValueUnquoted */;
        }
    };
    Tokenizer.prototype.attributeValueDoubleQuotedState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (this.currentCharacter === '"') {
            this.state = 12 /* afterAttributeValueQuoted */;
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueDoubleQuotedState';
        }
        else {
            token.currentAttribute.value += this.currentCharacter;
        }
    };
    Tokenizer.prototype.attributeValueSingleQuotedState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (this.currentCharacter === '\'') {
            this.state = 12 /* afterAttributeValueQuoted */;
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueDoubleQuotedState';
        }
        else {
            token.currentAttribute.value += this.currentCharacter;
        }
    };
    Tokenizer.prototype.attributeValueUnquotedState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            this.state = 4 /* beforeAttributeName */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<' || this.currentCharacter === '=' || this.currentCharacter === '`') {
            throw 'Parse error. attributeValueUnquotedState';
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueUnquotedState';
        }
        else {
            token.currentAttribute.value += this.currentCharacter;
        }
    };
    Tokenizer.prototype.afterAttributeValueQuotedState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            this.state = 4 /* beforeAttributeName */;
        }
        else if (this.currentCharacter === '/') {
            this.state = 5 /* selfClosingTag */;
        }
        else if (this.currentCharacter === '>') {
            this.state = 0 /* dataState */;
            this.emitToken(this.currentToken);
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. afterAttributeValueQuoted';
        }
        else {
            throw 'Parse error. afterAttributeValueQuoted';
        }
    };
    Tokenizer.prototype.selfClosingTagState = function () {
        var token = this.currentToken;
        this.readNextCharacter();
        if (this.currentCharacter === '>') {
            token.selfClosing = true;
            this.emitToken(this.currentToken);
            this.state = 0 /* dataState */;
        }
        else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. selfClosingTagState';
        }
        else {
            throw 'Parse error. selfClosingTagState';
        }
    };
    Tokenizer.prototype.readNextCharacter = function () {
        this.currentCharacterIndex += 1;
        if (this.currentCharacterIndex > this.charArray.length - 1) {
            //Simulate EOF
            this.currentCharacter = 'EOF';
        }
        else {
            this.currentCharacter = this.charArray[this.currentCharacterIndex];
        }
    };
    Tokenizer.prototype.emitToken = function (token) {
        this.tokens.push(token);
        this.currentToken = null;
    };
    Tokenizer.UPPERCASE_A_Z = /^[A-Z]$/;
    Tokenizer.LOWERCASE_A_Z = /^[a-z]$/;
    Tokenizer.WHITESPACE = /^\s$/;
    return Tokenizer;
})();
