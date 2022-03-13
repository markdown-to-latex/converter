import { buildMarkdownAST } from './ast/build';
import { lexer } from './lexer/lexer';
import { applyProcessing } from './processing';
import { printMarkdownAST } from './printer';
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
            current: null,
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
            current: null,
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
            autoEscapeUnderscoresCode:
                config?.latex?.autoEscapeUnderscoresCode ?? true,
            useLinkAs: config?.latex?.useLinkAs ?? 'underline',
            margin: {
                imageInnerTextSep:
                    config?.latex?.margin?.imageInnerTextSep ?? '3em',
                imageBelowCaptionSkip:
                    config?.latex?.margin?.imageBelowCaptionSkip ?? '-4ex',
                imageRemovedBelowCaptionSkip:
                    config?.latex?.margin?.imageRemovedBelowCaptionSkip ??
                    '-1.6em',
                imageAboveCaptionSkip:
                    config?.latex?.margin?.imageAboveCaptionSkip ?? '0.5em',
                codeInnerTextSep:
                    config?.latex?.margin?.codeInnerTextSep ?? '3em',
                codeBelowCaptionSkip:
                    config?.latex?.margin?.codeBelowCaptionSkip ?? '-4ex',
                codeRemovedBelowCaptionSkip:
                    config?.latex?.margin?.codeRemovedBelowCaptionSkip ??
                    '-1.6em',
                codeAboveCaptionSkip:
                    config?.latex?.margin?.codeAboveCaptionSkip ?? '-0.5em',
                tableBelowCaptionSkip:
                    config?.latex?.margin?.tableBelowCaptionSkip ?? '0em',
                tableAboveCaptionSkip:
                    config?.latex?.margin?.tableAboveCaptionSkip ?? '0em',
                tablePre: config?.latex?.margin?.tablePre ?? '2em',
                tablePost: config?.latex?.margin?.tablePost ?? '2em',
                tableRemovedPost:
                    config?.latex?.margin?.tableRemovedPost ?? '0em',
                mathAboveDisplaySkip:
                    config?.latex?.margin?.mathAboveDisplaySkip ?? '-0.9em',
                mathBelowDisplaySkip:
                    config?.latex?.margin?.mathBelowDisplaySkip ?? '0pt',
                mathAboveDisplayShortSkip:
                    config?.latex?.margin?.mathAboveDisplayShortSkip ?? '0pt',
                mathBelowDisplayShortSkip:
                    config?.latex?.margin?.mathBelowDisplayShortSkip ?? '0pt',
            },
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
