import * as marked from 'marked';
import {CustomInlineLatex, CustomTokenOpCode, Token} from './tokens';


export type ProcessingFunction<T extends Token = Token> = (
    token: Readonly<T>,
) => Token[];

export function processTokenList<T extends Token = Token>(
    tokenList: readonly T[],
    f: ProcessingFunction<T>,
): Token[] {
    const result: Token[] = [];
    for (const token of tokenList) {
        result.push(...f(token));
    }
    return result;
}
const regexpOpCode: RegExp = new RegExp(/!([A-Z0-9]+)\[([^\]]*)]\n?/g);

export const captureOpCodes: ProcessingFunction<marked.Tokens.Text> = function (
    token,
) {
    const resultTokens: (marked.Tokens.Text | CustomTokenOpCode)[] = [];

    // Capture OpCodes
    const searchIterator = token.text.matchAll(regexpOpCode);
    let item = searchIterator.next();
    let endIndex = 0;
    while (!item.done) {
        const opcode = item.value[1];
        const args = item.value[2] !== '' ? item.value[2].split('|') : [];

        const contentEndIndex = item.value.index!;
        const newEndIndex = contentEndIndex + item.value[0].length;
        if (endIndex !== contentEndIndex) {
            const content = token.text.slice(endIndex, contentEndIndex);
            resultTokens.push({
                type: 'text',
                text: content,
                raw: content,
            });
        }

        resultTokens.push({
            type: 'custom_opcode',
            raw: token.text.slice(contentEndIndex, newEndIndex),
            opcode: opcode,
            arguments: args,
        });

        endIndex = newEndIndex;
        item = searchIterator.next();
    }

    if (endIndex < token.text.length) {
        const content = token.text.slice(endIndex);
        resultTokens.push({
            type: 'text',
            text: content,
            raw: content,
        });
    }

    return resultTokens;
};

const latexInline: RegExp = new RegExp(/\$\$(.+?)\$\$/gs);
export const captureLatexInline: ProcessingFunction<marked.Tokens.Text> = function (
    token,
) {
    const resultTokens: (marked.Tokens.Text | CustomInlineLatex)[] = [];

    // Capture inline latex
    const searchIterator = token.text.matchAll(latexInline);
    let item = searchIterator.next();
    let endIndex = 0;
    while (!item.done) {
        const text = item.value[1];

        const contentEndIndex = item.value.index!;
        const newEndIndex = contentEndIndex + item.value[0].length;
        if (endIndex !== contentEndIndex) {
            const content = token.text.slice(endIndex, contentEndIndex);
            resultTokens.push({
                type: 'text',
                text: content,
                raw: content,
            });
        }

        resultTokens.push({
            type: 'custom_inline_latex',
            raw: token.text.slice(contentEndIndex, newEndIndex),
            text: text
        });

        endIndex = newEndIndex;
        item = searchIterator.next();
    }

    if (endIndex < token.text.length) {
        const content = token.text.slice(endIndex);
        resultTokens.push({
            type: 'text',
            text: content,
            raw: content,
        });
    }

    return resultTokens;
};
