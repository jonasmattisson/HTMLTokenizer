enum TokenizerStates {
    dataState,
    tagOpen,
    endTagOpen,
    tagName,
    beforeAttributeName,
    selfClosingTag,
    attributeName,
    afterAttributeName,
    beforeAttributeValue,
    attributeValueDoubleQuoted,
    attributeValueSingleQuoted,
    attributeValueUnquoted,
    afterAttributeValueQuoted
};