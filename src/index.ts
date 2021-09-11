import * as marked from 'marked';

export interface CustomTokenOpCode {
    type: 'custom_opcode';
    raw: string;
    arguments: string[];
}

export interface CustomInlineLatex {
    type: 'custom_inline_latex';
    raw: string;
    text: string;
}

export type CustomToken = CustomTokenOpCode;

export type TokenList = (marked.Token | CustomToken)[] & {
    links: {
        [key: string]: { href: string | null; title: string | null };
    };
};

export function lexer(text: string, options?: marked.MarkedOptions): TokenList {
    const originalTokenList: TokenList = marked.lexer(text, options);
    marked.walkTokens(
        originalTokenList as marked.TokensList,
        function (token) {

        },
    );

    return originalTokenList;
}

console.log();

marked.use({
    tokenizer: {},
    renderer: {},
});
