import { buildMarkdownAST } from './ast/build';
import { lexer } from './lexer/lexer';
import { applyProcessing } from './processing/process';
import { printMarkdownAST } from './printer/printer';
import * as fs from 'fs';
import * as path from 'path';
import { Context, WriteFileFunction } from './printer/context';
import { readConfig } from './config';
import { MarkDownToLaTeXConverter } from './printer/types';

export { buildMarkdownAST, lexer, applyProcessing, printMarkdownAST };

export function initContext(
    writeFile: WriteFileFunction,
    config?: Partial<MarkDownToLaTeXConverter>,
): Context {
    return {
        writeFile,
        code: {
            key: '',
            label: '',
            lang: '',
            cols: 1,
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
            useMonospaceFont: config?.latex?.useMonospaceFont ?? true,
        },
    };
}

export function convertMarkdownFiles(rootDir: string): void {
    const writeFile: WriteFileFunction = function (content, filepath) {
        fs.writeFileSync(filepath, content, 'utf8');
    };

    const configFileName = path.join(rootDir, 'md-to-latex-converter.yml');
    if (!fs.existsSync(configFileName)) {
        throw new Error(`Config ${configFileName} not found`);
    }

    const config = readConfig(configFileName);
    const context = initContext((content, fileName) => {
        return writeFile(content, fileName, context);
    }, config);

    for (const fileInfo of config.files) {
        const filepath = fileInfo.path;
        const fullFilepath = path.join(rootDir, filepath);

        const outDir = path.join(rootDir, path.dirname(fileInfo.out));
        fs.mkdirSync(outDir, { recursive: true });

        const lexerResult = lexer(fs.readFileSync(fullFilepath, 'utf8'));
        const result = buildMarkdownAST(lexerResult, {
            filepath: path.join(rootDir, fileInfo.out),
        });

        applyProcessing(result);

        printMarkdownAST(result, context);
    }
}
