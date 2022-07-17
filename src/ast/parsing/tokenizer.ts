/**
 * Used for selecting certain tokens
 */
import { RawNodeType, TokensNode } from '../node';

export interface Token {
    text: string;
    pos: number;
    type: TokenType;
}

export interface TokenizeResult {
    text: string;
    tokens: Token[];
    basePos: number;
}

export const enum TokenType {
    Spacer = 'Spacer' /* Spaces, tabs, line breaks */,
    Letter = 'Letter' /* Any language letter and numbers */,
    SeparatedSpecial = 'SeparatedSpecial' /* Brackets, semicolons */,
    JoinableSpecial = 'JoinableSpecial' /* Octothorpe, backticks */,
    Delimiter = 'Delimiter' /* Line break */,
    Other = 'Other' /* Not matched characters */,
}

const JOINABLE_TOKEN_TYPES: TokenType[] = [
    TokenType.Spacer,
    TokenType.Letter,
    TokenType.Delimiter,
];

const SPACER_REGEXP = new RegExp(/[ \t\r]/);
const SEPARATED_SPECIAL_REGEXP = new RegExp(
    /[\[\]{}~!@%^&()=+\\,.<>;:'"|№?]/,
);
const JOINABLE_SPECIAL_REGEXP = new RegExp(/[`#$*\-_\/]/);
const NUMBER_REGEXP = new RegExp(/\d/);

function isCharSeparatedSpecial(char: string): boolean {
    return !!char.match(SEPARATED_SPECIAL_REGEXP);
}

function isCharJoinableSpecial(char: string): boolean {
    return !!char.match(JOINABLE_SPECIAL_REGEXP);
}

function isCharSpacer(char: string): boolean {
    return !!char.match(SPACER_REGEXP);
}

function isCharLetter(char: string): boolean {
    return char.toLowerCase() !== char.toUpperCase();
}

function isCharNumber(char: string): boolean {
    return !!char.match(NUMBER_REGEXP);
}

function isCharDelimiter(char: string): boolean {
    return char === '\n';
}

function getCharType(char: string): TokenType {
    if (isCharDelimiter(char)) {
        return TokenType.Delimiter;
    }
    if (isCharSpacer(char)) {
        return TokenType.Spacer;
    }
    if (isCharJoinableSpecial(char)) {
        return TokenType.JoinableSpecial;
    }
    if (isCharSeparatedSpecial(char)) {
        return TokenType.SeparatedSpecial;
    }
    if (isCharLetter(char) || isCharNumber(char)) {
        return TokenType.Letter;
    }

    return TokenType.Other;
}

function createToken(char: string, pos: number): Token {
    return {
        text: char,
        pos: pos,
        type: getCharType(char),
    };
}

export function tokenize(text: string, basePos: number = 0): TokenizeResult {
    const tokens: Token[] = [];
    let currentToken: Token | null = null;

    for (const [i, c] of text.split('').map((v, i) => [i, v] as const)) {
        if (!currentToken) {
            currentToken = createToken(c, i + basePos);
            continue;
        }

        const type = getCharType(c);
        const currentTokenEndChar =
            currentToken.text[currentToken.text.length - 1];
        const joinables = ['$', '`'];
        if (
            type === currentToken.type &&
            JOINABLE_TOKEN_TYPES.indexOf(type) !== -1
        ) {
            currentToken.text += c;
        } else if (
            type === TokenType.JoinableSpecial &&
            (currentTokenEndChar === c ||
                (joinables.indexOf(currentTokenEndChar) !== -1 &&
                    joinables.indexOf(c) !== -1))
        ) {
            currentToken.text += c;
        } else {
            tokens.push(currentToken);
            currentToken = createToken(c, i + basePos);
        }
    }

    if (currentToken) {
        tokens.push(currentToken);
    }

    return {
        text,
        basePos,
        tokens: tokens,
    };
}

export function tokensToNode(tokens: TokenizeResult): TokensNode {
    let lastToken: Token | null = tokens.tokens.length
        ? tokens.tokens[tokens.tokens.length - 1]
        : null;
    return {
        type: RawNodeType.Tokens,
        text: tokens.text,
        tokens: tokens.tokens,
        pos: {
            start: tokens.basePos,
            end: lastToken
                ? lastToken.pos + lastToken.text.length
                : tokens.basePos,
        },
        parent: null,
    };
}
