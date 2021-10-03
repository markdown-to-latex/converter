import * as marked from 'marked';

export type Token = marked.Token;
export type TokenListContainer = Token[] & {
    links: {
        [key: string]: { href: string | null; title: string | null };
    };
};

export type TokenTypes = Token['type'];

const TokenByTypeArray = {
    text: {} as marked.Tokens.Text,
    paragraph: {} as marked.Tokens.Paragraph,
    code: {} as marked.Tokens.Code,
    table: {} as marked.Tokens.Table,
    br: {} as marked.Tokens.Br,
    blockquote: {} as marked.Tokens.Blockquote,
    def: {} as marked.Tokens.Def,
    del: {} as marked.Tokens.Del,
    em: {} as marked.Tokens.Em,
    html: {} as marked.Tokens.HTML,
    codespan: {} as marked.Tokens.Codespan,
    hr: {} as marked.Tokens.Hr,
    escape: {} as marked.Tokens.Escape,
    heading: {} as marked.Tokens.Heading,
    image: {} as marked.Tokens.Image,
    link: {} as marked.Tokens.Link,
    list: {} as marked.Tokens.List,
    space: {} as marked.Tokens.Space,
    strong: {} as marked.Tokens.Strong,
    list_item: {} as marked.Tokens.ListItem,
} as const;

export type TokenByType = typeof TokenByTypeArray;

// Compile-time interface validation
const _ = TokenByTypeArray as {
    [Key in TokenTypes]: Token;
};
