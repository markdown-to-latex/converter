import { marked } from 'marked';
import { Token, TokenByType } from './tokens';

type Visitor<T extends Token> = (token: Readonly<T>) => Token | Token[];

export interface TokenWithChildren {
    tokens?: Token[];
    items?: marked.Tokens.ListItem[];
}

export function processTokenChildren(
    key: keyof TokenWithChildren,
    token: TokenWithChildren,
) {
    const tokens = token[key];
    if (tokens === undefined) {
        return;
    }

    const newChildren: Token[] = [];
    for (const child of tokens) {
        newChildren.push(...processTokenIfVisitorExists(child));
    }

    token[key] = newChildren as (Token & marked.Tokens.ListItem)[];
}

export function processTokenIfVisitorExists(token: Readonly<Token>): Token[] {
    const visitor = processingVisitors[token.type] as Visitor<Token>;
    if (visitor === undefined) {
        return [token];
    }

    const result = visitor(token);
    if (Array.isArray(result)) {
        return result;
    }

    return [result];
}

// Visitors here
// Goal: make any pre-processing here

const processingVisitors: {
    [key in keyof TokenByType]?: Visitor<TokenByType[key]>;
} = {
    table: token => {
        // Workaround
        for (const headerCell of token.header) {
            processTokenChildren('tokens', headerCell);
        }
        for (const tableCellRow of token.rows) {
            for (const tableCell of tableCellRow) {
                processTokenChildren('tokens', tableCell);
            }
        }

        return token;
    },
};
