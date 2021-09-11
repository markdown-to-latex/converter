import {Token, TokenListContainer} from "./tokens";
import * as marked from "marked";
import {processTokenIfVisitorExists} from "./visitors";

function parseTokens(tokens: Readonly<Token[]>): Token[] {
    const resultList: Token[] = [];
    for (const token of tokens) {
        resultList.push(
            ...processTokenIfVisitorExists(token)
        )
    }
    return resultList;
}

export function lexer(text: string, options?: marked.MarkedOptions): TokenListContainer {
    const originalTokenList: Readonly<TokenListContainer> = marked.lexer(text, options);
    const links = originalTokenList.links

    const resultList: TokenListContainer = parseTokens(originalTokenList) as TokenListContainer;
    resultList.links = links;

    return resultList;
}