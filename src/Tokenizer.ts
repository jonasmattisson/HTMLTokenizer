class Tokenizer {
    private static UPPERCASE_A_Z: RegExp = /^[A-Z]$/;
    private static LOWERCASE_A_Z: RegExp = /^[a-z]$/;
    private static WHITESPACE: RegExp = /^\s$/;

    private state: TokenizerStates = TokenizerStates.dataState;
    private tokens: Array<Token>;
    private currentToken: Token;

    private currentCharacter: string;
    private currentCharacterIndex: number = -1;

    constructor(private charArray: Array<string>){
        this.tokens = [];
    }

    public getTokens(): Array<Token>  {
        return this.stateMachine();
    }

    private stateMachine(): Array<Token> {
        var maxLoops: number = 1000;
        var i: number = 0;
        while(!(this.tokens[this.tokens.length-1] instanceof EOFToken) && i < maxLoops) {
            switch (this.state) {
                case TokenizerStates.dataState:
                    this.dataState();
                    break;
                case TokenizerStates.tagOpen:
                    this.tagOpenState();
                    break;
                case TokenizerStates.endTagOpen:
                    this.endTagOpenState();
                    break;
                case TokenizerStates.tagName:
                    this.tagNameState();
                    break;
                case TokenizerStates.beforeAttributeName:
                    this.beforeAttributeNameState();
                    break;
                case TokenizerStates.selfClosingTag:
                    this.selfClosingTagState();
                    break;
                case TokenizerStates.attributeName:
                    this.attributeNameState();
                    break;
                case TokenizerStates.afterAttributeName:
                    this.afterAttributeNameState();
                    break;
                case TokenizerStates.beforeAttributeValue:
                    this.beforeAttributeValueState();
                    break;
                case TokenizerStates.attributeValueDoubleQuoted:
                    this.attributeValueDoubleQuotedState();
                    break;
                case TokenizerStates.attributeValueSingleQuoted:
                    this.attributeValueSingleQuotedState();
                    break;
                case TokenizerStates.attributeValueUnquoted:
                    this.attributeValueUnquotedState();
                    break;
                case TokenizerStates.afterAttributeValueQuoted:
                    this.afterAttributeValueQuotedState();
                    break;
                case TokenizerStates.markupDeclarationOpen:
                    this.markupDeclarationOpenState();
                    break;
                case TokenizerStates.commentStart:
                    this.commentStartState();
                    break;
                case TokenizerStates.commentStartDash:
                    this.commentStartDashState();
                    break;
                case TokenizerStates.comment:
                    this.commentState();
                    break;
                case TokenizerStates.commentEndDash:
                    this.commentEndDashState();
                    break;
                case TokenizerStates.commentEnd:
                    this.commentEndState();
                    break;
            }
            i += 1;
        }

        return this.tokens;
    }

    private dataState () {
        this.readNextCharacter();
        switch (this.currentCharacter) {
            case '<':
                this.state = TokenizerStates.tagOpen;
                break;
            case 'EOF':
                this.emitToken(new EOFToken());
                break;
            default:
                this.emitToken(new CharacterToken(this.currentCharacter));
                break;
        }
    }

    private tagOpenState () {
        this.readNextCharacter();
        if (this.currentCharacter === '!') {
            this.state = TokenizerStates.markupDeclarationOpen;
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.endTagOpen;
        } else if (Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new StartTagToken(this.currentCharacter.toLowerCase());
            this.state = TokenizerStates.tagName;
        } else if (Tokenizer.LOWERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new StartTagToken(this.currentCharacter);
            this.state = TokenizerStates.tagName;
        } else {
            throw 'Character: ' + this.currentCharacter + '.Parse error. Emit a U+003C LESS-THAN SIGN character token and reconsume the current input character in the data state.';
        }
    }

    private endTagOpenState () {
        this.readNextCharacter();
        if(Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new EndTagToken(this.currentCharacter.toLowerCase());
            this.state = TokenizerStates.tagName;
        } else if (Tokenizer.LOWERCASE_A_Z.test(this.currentCharacter)) {
            this.currentToken = new EndTagToken(this.currentCharacter);
            this.state = TokenizerStates.tagName;
        } else {
            throw 'Parse error. End Tag Open state';
        }
    }

    private tagNameState () {
        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {;
            this.state = TokenizerStates.beforeAttributeName;
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.selfClosingTag;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if(Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
             (<TagToken> this.currentToken).tagName += this.currentCharacter;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. Tag name state';
        } else {
            (<TagToken> this.currentToken).tagName += this.currentCharacter;
        }
    }

    private beforeAttributeNameState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {;
            //Ignore character
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.selfClosingTag;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if(Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.addAttribute({ name: this.currentCharacter.toLowerCase(), value: ''});
            this.state = TokenizerStates.attributeName;
        } else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '=' || this.currentCharacter === '<') {
            throw 'Parse error. beforeAttributeNameState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. beforeAttributeNameState';
        } else {
            token.addAttribute({ name: this.currentCharacter, value: ''});
            this.state = TokenizerStates.attributeName;
        }
    }

    private attributeNameState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {;
            this.state = TokenizerStates.afterAttributeName;
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.selfClosingTag;
        } else if (this.currentCharacter === '=') {
            this.state = TokenizerStates.beforeAttributeValue;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if(Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.currentAttribute.name += this.currentCharacter.toLowerCase();
        } else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<') {
            throw 'Parse error. attributeNameState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeNameState';
        } else {
            token.currentAttribute.name += this.currentCharacter;
        }
    }

    private afterAttributeNameState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {;
           //Ignore
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.selfClosingTag;
        } else if (this.currentCharacter === '=') {
            this.state = TokenizerStates.beforeAttributeValue;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if(Tokenizer.UPPERCASE_A_Z.test(this.currentCharacter)) {
            token.addAttribute({ name: this.currentCharacter.toLowerCase(), value: ''});
            this.state = TokenizerStates.attributeName;
        } else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<') {
            throw 'Parse error. afterAttributeNameState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. afterAttributeNameState';
        } else {
            token.addAttribute({ name: this.currentCharacter, value: ''});
            this.state = TokenizerStates.attributeName;
        }
    }

    private beforeAttributeValueState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            //Ignore
        } else if (this.currentCharacter === '"') {
            this.state = TokenizerStates.attributeValueDoubleQuoted;
        } else if (this.currentCharacter === '&') {
            this.state = TokenizerStates.attributeValueUnquoted;
            this.currentCharacterIndex -= 1;
        } else if (this.currentCharacter === '\'') {
            this.state = TokenizerStates.attributeValueSingleQuoted;
        } else if (this.currentCharacter === '>') {
            throw 'Parse error. beforeAttributeValueState';
        } else if (this.currentCharacter === '<' || this.currentCharacter === '=' || this.currentCharacter === '`') {
            throw 'Parse error. beforeAttributeValueState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. beforeAttributeValueState';
        } else {
            token.currentAttribute.value += this.currentCharacter;
            this.state = TokenizerStates.attributeValueUnquoted;
        }
    }

    private attributeValueDoubleQuotedState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '"') {
            this.state = TokenizerStates.afterAttributeValueQuoted;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueDoubleQuotedState';
        } else {
            token.currentAttribute.value += this.currentCharacter;
        }
    }

    private attributeValueSingleQuotedState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '\'') {
            this.state = TokenizerStates.afterAttributeValueQuoted;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueDoubleQuotedState';
        } else {
            token.currentAttribute.value += this.currentCharacter;
        }
    }

    private attributeValueUnquotedState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            this.state = TokenizerStates.beforeAttributeName;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if (this.currentCharacter === '"' || this.currentCharacter === '\'' || this.currentCharacter === '<' ||
                   this.currentCharacter === '=' || this.currentCharacter === '`') {

            throw 'Parse error. attributeValueUnquotedState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. attributeValueUnquotedState';
        } else {
            token.currentAttribute.value += this.currentCharacter;
        }
    }

    private afterAttributeValueQuotedState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if(Tokenizer.WHITESPACE.test(this.currentCharacter)) {
            this.state = TokenizerStates.beforeAttributeName;
        } else if (this.currentCharacter === '/') {
            this.state = TokenizerStates.selfClosingTag;
        } else if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. afterAttributeValueQuoted';
        } else {
            throw 'Parse error. afterAttributeValueQuoted';
        }
    }

    private selfClosingTagState () {
        var token = <StartTagToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '>') {
            token.selfClosing = true;
            this.emitToken(this.currentToken);
            this.state = TokenizerStates.dataState;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. selfClosingTagState';
        } else {
            throw 'Parse error. selfClosingTagState';
        }
    }

    private markupDeclarationOpenState () {
        if(this.charArrayEquals(this.characterLookahed(2), ['-','-'])) {
            this.readNextCharacter(); this.readNextCharacter();
            this.state = TokenizerStates.commentStart;
            this.currentToken = new CommentToken('');
        } else {
            throw 'Parse error. markupDeclarationOpenState. Only comments implemented';
        }
    }

    private commentStartState () {
        var token = <CommentToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '-') {
            this.state = TokenizerStates.commentStartDash;
        } else if (this.currentCharacter === '>') {
            throw 'Parse error. commentStartState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. commentStartState';
        } else {
            token.comment += this.currentCharacter;
            this.state = TokenizerStates.comment;
        }
    }

    private commentStartDashState () {
        var token = <CommentToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '-') {
            this.state = TokenizerStates.commentEnd;
        } else if (this.currentCharacter === '>') {
            throw 'Parse error. commentStartDashState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. commentStartDashState';
        } else {
            token.comment += '-' + this.currentCharacter;
            this.state = TokenizerStates.comment;
        }
    }

    private commentState () {
        var token = <CommentToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '-') {
            this.state = TokenizerStates.commentEndDash;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. commentState';
        } else {
            token.comment += this.currentCharacter;
        }
    }

    private commentEndDashState () {
        var token = <CommentToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '-') {
            this.state = TokenizerStates.commentEnd;
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. commentEndDashState';
        } else {
            token.comment += '-' + this.currentCharacter;
            this.state = TokenizerStates.comment;
        }
    }

    private commentEndState () {
        var token = <CommentToken> this.currentToken;

        this.readNextCharacter();
        if (this.currentCharacter === '>') {
            this.state = TokenizerStates.dataState;
            this.emitToken(this.currentToken);
        } else if (this.currentCharacter === '!') {
            throw 'Parse error. commentEndState';
        } else if (this.currentCharacter === '-') {
            throw 'Parse error. commentEndState';
        } else if (this.currentCharacter === 'EOF') {
            throw 'Parse error. EOF. commentEndState';
        } else {
            throw 'Parse error. commentEndState';
        }
    }


    private charArrayEquals (arr1: Array<string>, arr2: Array<string>): boolean {
        if(arr1.length !== arr2.length) {
            return false;
        }

        var equals = true;
        for(var i = 0; i < arr1.length; i += 1) {
            equals = equals && arr1[i] === arr2[i];
        }

        return equals;
    }

    private characterLookahed(nbrChars: number): Array<string> {
        var chars: Array<string> = [];

        for(var i = 1; i <= nbrChars; i += 1) {
            chars.push(this.charArray[this.currentCharacterIndex + i]);
        }

        return chars;
    }

    private readNextCharacter(): void {
        this.currentCharacterIndex += 1;

        if(this.currentCharacterIndex > this.charArray.length - 1) {
            //Simulate EOF
            this.currentCharacter = 'EOF';
        } else {
            this.currentCharacter = this.charArray[this.currentCharacterIndex];
        }
    }

    private emitToken(token: Token): void {
        this.tokens.push(token);
        this.currentToken = null;
    }
}