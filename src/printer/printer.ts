import { Node } from '../ast/nodes';
import { WriteFileFunction } from './context';
import { applyPrinterVisitors } from './visitors';

function prettifyLaTeX(text: string): string {
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/\n{2,}$/gm, '\n');
    return text;
}

export function printMarkdownAST(
    rootNode: Node,
    writeFile: WriteFileFunction,
): void {
    applyPrinterVisitors(rootNode, {
        writeFile: (content, fileName, context) => {
            content = prettifyLaTeX(content);
            return writeFile(content, fileName, context);
        },
        code: {
            key: '',
            label: '',
            lang: '',
        },
        applications: {
            accessKeys: [],
            keyToData: {},
        },
        picture: {
            key: '',
            height: '',
            keyToLabel: {},
            label: '',
        },
        references: {
            accessKeys: [],
            keyToData: {},
        },
        table: {
            key: '',
            label: '',
            keyToLabel: {},
        },
        config: {
            defaultFontSize: 14,
        },
    });
}
