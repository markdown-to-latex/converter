import * as marked from "marked";
import {Token, TokenByType} from "./tokens";

type Visitor<T extends Token> = (token: Readonly<T>) => Token | Token[]

export function processTokenChildren(token: { tokens?: Token[] }) {
    if (token.tokens === undefined) {
        return;
    }

    const newChildren: Token[] = [];
    for (const child of token.tokens) {
        newChildren.push(...processTokenIfVisitorExists(child))
    }

    token.tokens = newChildren;
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
// Goal: make custom offsets from text into custom tokens

const processingVisitors: {
    [key in keyof TokenByType]?: Visitor<TokenByType[key]>;
} = {
    paragraph: token => {
        const newToken: marked.Tokens.Paragraph = {...token};
        processTokenChildren(newToken);

        return newToken;
    },
    text: token => {
        console.log('amogus text')
        return token;
    },
}

