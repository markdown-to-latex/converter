import * as marked from 'marked';
import { CustomTokenOpCode } from './tokens';

const regexpOpCode: RegExp = new RegExp(/!([A-Z0-9]+)\[([^\]]*)]\n?/g);

export function captureOpCodes(
    token: Readonly<marked.Tokens.Text>,
): (marked.Tokens.Text | CustomTokenOpCode)[] {
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
}
