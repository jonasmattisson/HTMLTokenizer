interface ITagTokenAttriute {
    name: String;
    value: String;
}

class Token {

}

class EOFToken extends Token{

}

class CharacterToken extends Token {
    constructor(public character) {
        super();
    }
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