import * as marked from 'marked';

export type Token = marked.Token;
export type TokenListContainer = Token[] & {
    links: {
        [key: string]: { href: string | null; title: string | null };
    };
};

export interface TokenByType {
    text: marked.Tokens.Text;
    paragraph: marked.Tokens.Paragraph;
    code: marked.Tokens.Code;
    table: marked.Tokens.Table;
    br: marked.Tokens.Br;
    blockquote: marked.Tokens.Blockquote;
    def: marked.Tokens.Def;
    del: marked.Tokens.Del;
    em: marked.Tokens.Em;
    html: marked.Tokens.HTML;
    codespan: marked.Tokens.Codespan;
    hr: marked.Tokens.Hr;
    escape: marked.Tokens.Escape;
    heading: marked.Tokens.Heading;
    image: marked.Tokens.Image;
    link: marked.Tokens.Link;
    list: marked.Tokens.List;
    space: marked.Tokens.Space;
    strong: marked.Tokens.Strong;
    list_item: marked.Tokens.ListItem;
}
