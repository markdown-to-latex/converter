import { buildMarkdownAST } from './ast/build';
import { lexer } from './lexer/lexer';
import { printMarkdownAST } from './printer';
import * as fs from 'fs';
import * as path from 'path';
import {
    Context,
    ContextConfig,
    LatexEscapeDataStrict,
    LatexInfoStrict,
    WriteFileFunction,
} from './printer/context';
import { readConfig } from './config';
import { MarkDownToLaTeXConverter } from './printer/types';

export { buildMarkdownAST, lexer, printMarkdownAST };

const defaultConfig: ContextConfig = {
    latex: {
        useCodeSpanAs: 'monospace',
        useLinkAs: 'underline',
        extendAutoEscapes: [],
        defaultAutoEscapes: true,
        margin: {
            imageInnerTextSep: '3em',
            imageBelowCaptionSkip: '-4ex',
            imageRemovedBelowCaptionSkip: '-1.6em',
            imageAboveCaptionSkip: '0.5em',
            codeInnerTextSep: '3em',
            codeBelowCaptionSkip: '-4ex',
            codeRemovedBelowCaptionSkip: '-1.6em',
            codeAboveCaptionSkip: '-0.5em',
            tableBelowCaptionSkip: '0em',
            tableAboveCaptionSkip: '0em',
            tablePre: '2em',
            tablePost: '2em',
            tableRemovedPost: '0em',
            mathAboveDisplaySkip: '-0.9em',
            mathBelowDisplaySkip: '0pt',
            mathAboveDisplayShortSkip: '0pt',
            mathBelowDisplayShortSkip: '0pt',
        },
    },
    opCode: {
        starter: '!',
        delimiter: '!',
    },
};

/**
 * Default escapes applied to the LaTeX
 *
 * @see https://tex.stackexchange.com/a/34586
 */
const defaultEscapes: LatexEscapeDataStrict[] = [
    {
        chars: ['%', '_', '#', '&'],
        inText: true,
        inCodeSpan: true,
        inLink: true,
        replacer: '\\$1',
    },
    {
        chars: ['\\$'],
        inText: false,
        inCodeSpan: true,
        inLink: true,
        replacer: '\\$1',
    },
    {
        chars: ['{', '}'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\$1',
    },
    {
        chars: ['~'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\textasciitilde',
    },
    {
        chars: ['\\^'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\textasciicircum',
    },
    {
        chars: ['"'],
        inText: true,
        inCodeSpan: true,
        inLink: true,
        replacer: '$1{}',
    },
];

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
            latex: {
                useCodeSpanAs:
                    config?.latex?.useCodeSpanAs ??
                    defaultConfig.latex.useCodeSpanAs,
                useLinkAs:
                    config?.latex?.useLinkAs ?? defaultConfig.latex.useLinkAs,
                extendAutoEscapes:
                    config?.latex?.extendAutoEscapes?.map(d => ({
                        chars: d.chars,
                        inText: d.inText ?? true,
                        inCodeSpan: d.inCodeSpan ?? true,
                        inLink: d.inLink ?? true,
                        replacer: d.replacer ?? '\\$1',
                    })) ?? defaultConfig.latex.extendAutoEscapes,
                defaultAutoEscapes:
                    config?.latex?.defaultAutoEscapes ??
                    defaultConfig.latex.defaultAutoEscapes,
                margin: {
                    imageInnerTextSep:
                        config?.latex?.margin?.imageInnerTextSep ??
                        defaultConfig.latex.margin.imageInnerTextSep,
                    imageBelowCaptionSkip:
                        config?.latex?.margin?.imageBelowCaptionSkip ??
                        defaultConfig.latex.margin.imageBelowCaptionSkip,
                    imageRemovedBelowCaptionSkip:
                        config?.latex?.margin?.imageRemovedBelowCaptionSkip ??
                        defaultConfig.latex.margin.imageRemovedBelowCaptionSkip,
                    imageAboveCaptionSkip:
                        config?.latex?.margin?.imageAboveCaptionSkip ??
                        defaultConfig.latex.margin.imageAboveCaptionSkip,
                    codeInnerTextSep:
                        config?.latex?.margin?.codeInnerTextSep ??
                        defaultConfig.latex.margin.codeInnerTextSep,
                    codeBelowCaptionSkip:
                        config?.latex?.margin?.codeBelowCaptionSkip ??
                        defaultConfig.latex.margin.codeBelowCaptionSkip,
                    codeRemovedBelowCaptionSkip:
                        config?.latex?.margin?.codeRemovedBelowCaptionSkip ??
                        defaultConfig.latex.margin.codeRemovedBelowCaptionSkip,
                    codeAboveCaptionSkip:
                        config?.latex?.margin?.codeAboveCaptionSkip ??
                        defaultConfig.latex.margin.codeAboveCaptionSkip,
                    tableBelowCaptionSkip:
                        config?.latex?.margin?.tableBelowCaptionSkip ??
                        defaultConfig.latex.margin.tableBelowCaptionSkip,
                    tableAboveCaptionSkip:
                        config?.latex?.margin?.tableAboveCaptionSkip ??
                        defaultConfig.latex.margin.tableAboveCaptionSkip,
                    tablePre:
                        config?.latex?.margin?.tablePre ??
                        defaultConfig.latex.margin.tablePre,
                    tablePost:
                        config?.latex?.margin?.tablePost ??
                        defaultConfig.latex.margin.tablePost,
                    tableRemovedPost:
                        config?.latex?.margin?.tableRemovedPost ??
                        defaultConfig.latex.margin.tableRemovedPost,
                    mathAboveDisplaySkip:
                        config?.latex?.margin?.mathAboveDisplaySkip ??
                        defaultConfig.latex.margin.mathAboveDisplaySkip,
                    mathBelowDisplaySkip:
                        config?.latex?.margin?.mathBelowDisplaySkip ??
                        defaultConfig.latex.margin.mathBelowDisplaySkip,
                    mathAboveDisplayShortSkip:
                        config?.latex?.margin?.mathAboveDisplayShortSkip ??
                        defaultConfig.latex.margin.mathAboveDisplayShortSkip,
                    mathBelowDisplayShortSkip:
                        config?.latex?.margin?.mathBelowDisplayShortSkip ??
                        defaultConfig.latex.margin.mathBelowDisplayShortSkip,
                },
            },
            opCode: {
                starter:
                    config?.opCode?.starter ?? defaultConfig.opCode.starter,
                delimiter:
                    config?.opCode?.delimiter ?? defaultConfig.opCode.delimiter,
            },
        },
    };
}

export function getConfigLatexEscapes(
    latexInfo: LatexInfoStrict,
): LatexEscapeDataStrict[] {
    return [
        ...latexInfo.extendAutoEscapes,
        ...(latexInfo.defaultAutoEscapes ? defaultEscapes : []),
    ];
}

export function getContextEscapes(ctx: Context): LatexEscapeDataStrict[] {
    return getConfigLatexEscapes(ctx.config.latex);
}

export function fileToNode(content: string, filepath: string): RawNode {
    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        pos: {
            start: 0,
            end: content.length,
        },
        raw: content,
        path: filepath,
        children: [],
    };

    const rawNode: RawNode = {
        type: RawNodeType.Raw,
        parent: fileNode,
        pos: {
            start: 0,
            end: content.length,
        },
        text: content,
    };
    fileNode.children.push(rawNode);

    return rawNode;
}

export function convertMarkdownFiles(rootDir: string): DiagnoseList {
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

        // TODO: apply visitors
        applyProcessing(result, context);

        printMarkdownAST(result, context);
    }
}
