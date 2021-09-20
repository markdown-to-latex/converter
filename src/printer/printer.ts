import { Node } from '../ast/nodes';
import {  WriteFileFunction } from './context';
import { applyPrinterVisitors } from './visitors';
import {MarkDownToLaTeXConfig} from "./config";

function prettifyLaTeX(text: string): string {
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remove unnecessary breaks in begin and end of the file
    text = text.replace(/^\n+/g, '');
    text = text.replace(/\n{2,}$/g, '\n');
    return text;
}

export function printMarkdownAST(
    rootNode: Node,
    writeFile: WriteFileFunction,
    config?: Partial<MarkDownToLaTeXConfig>,
): void {
    config = config ?? {};

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
            key: '',
            accessKeys: [],
            keyToData: {},
        },
        table: {
            key: '',
            label: '',
            keyToLabel: {},
        },
        config: {
            defaultFontSize: config.defaultFontSize ?? 14,
            useMonospaceFont: config.useMonospaceFont ?? true,
        },
    });
}
