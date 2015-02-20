class Token {}

/* EOF TOKEN */
class EOFToken extends Token {}

/* DOCTYPE TOKEN */
class DoctypeToken extends Token {}

/* COMMENT TOKEN */
class CommentToken extends Token {
    constructor(public comment) {
        super();
    }
}

/* CHARACTER TOKEN */
class CharacterToken extends Token {
    constructor(public character) {
        super();
    }
}

/* TAG TOKENS */
interface ITagTokenAttriute {
    name: String;
    value: String;
}

class TagToken extends Token {
    public tagName: String;
    public attributes: Array<ITagTokenAttriute> = [];
    public selfClosing: boolean = false;
    public currentAttribute: ITagTokenAttriute = null;

    constructor(tagName: String) {
        super();
        this.tagName = tagName;
    }

    public addAttribute(attribute: ITagTokenAttriute): void {
        this.currentAttribute = attribute;
        this.attributes.push(attribute);
    }
}

class StartTagToken extends TagToken {
    constructor(tagName: String) {

        super(tagName);
    }
}

class EndTagToken extends TagToken {
    constructor(tagName: String) {

        super(tagName);
    }
}