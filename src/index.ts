import * as fs from 'fs';
import * as path from 'path';
import { readConfig } from './config';
import { FileNode, NodeType, RawNode, RawNodeType } from './ast/node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
    printDiagnosticList,
} from './diagnose';
import { parseFile } from './ast/parsing';
import { applyMacros, applyMacrosFull } from './macro';
import { buildConfig, createLatexPrinter, LatexPrinter } from './printer/latex';
import { LatexPrinterConfiguration } from './printer/latex/config';
import { MarkDownToLaTeXConverter } from './config/types';
import {
    Context,
    ContextE,
    diagnoseContextAll,
    initContext,
} from './macro/context';

// TODO: deprecate
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

export const DEFAULT_CONFIG_NAME = 'md-to-latex-converter.yml';

export interface ReadGlobalConfigResult {
    result: MarkDownToLaTeXConverter;
    diagnostic: DiagnoseList;
}

export function readGlobalConfig(rootDir: string): ReadGlobalConfigResult {
    const diagnostic: DiagnoseList = [];

    const configFilePath = path.join(rootDir, DEFAULT_CONFIG_NAME);
    if (!fs.existsSync(configFilePath)) {
        diagnostic.push({
            message: `Config ${configFilePath} not found`,
            severity: DiagnoseSeverity.Fatal,
            pos: {
                start: {
                    absolute: 0,
                    column: 0,
                    line: 0,
                },
                end: {
                    absolute: 0,
                    column: 0,
                    line: 0,
                },
            },
            filePath: configFilePath,
            errorType: DiagnoseErrorType.ApplyParserError,
        });
    }

    let config: MarkDownToLaTeXConverter;
    try {
        config = readConfig(configFilePath);
    } catch (e) {
        const message = Object.prototype.hasOwnProperty.call(e, 'toString')
            ? (e as Object).toString()
            : 'Unknown error';
        diagnostic.push({
            message,
            severity: DiagnoseSeverity.Fatal,
            pos: {
                start: {
                    absolute: 0,
                    column: 0,
                    line: 0,
                },
                end: {
                    absolute: 0,
                    column: 0,
                    line: 0,
                },
            },
            filePath: configFilePath,
            errorType: DiagnoseErrorType.ApplyParserError,
        });

        config = { files: [] };
    }

    return {
        result: config,
        diagnostic,
    };
}

export interface ConvertMarkdownFileResult {
    result: string;
    context: Context;
    diagnostic: DiagnoseList;
}

export function convertMarkdownFile(
    filepath: string,
    printerConfig: LatexPrinterConfiguration,
    macrosContext?: Context,
): ConvertMarkdownFileResult {
    const diagnostic: DiagnoseList = [];

    const content = fs.readFileSync(filepath, 'utf8');

    const fileResult = parseFile(content, filepath);
    const fileNode = fileResult.result;
    diagnostic.push(...fileResult.diagnostic);

    const macrosDiagnostic = applyMacros(fileNode, macrosContext);
    diagnostic.push(...macrosDiagnostic.diagnostic);
    macrosDiagnostic.context.diagnostic = [];

    const printer = createLatexPrinter(printerConfig);
    const printerResult = printer.processNode(printer, fileNode);
    diagnostic.push(...printerResult.diagnostic);

    return {
        result: printerResult.result,
        context: macrosDiagnostic.context,
        diagnostic,
    };
}

export function convertMarkdownFiles(
    rootDir: string,
    noEmit: boolean = false,
): DiagnoseList {
    const diagnostic: DiagnoseList = [];

    const { result: globalConfig, diagnostic: configDiagnostic } =
        readGlobalConfig(rootDir);
    diagnostic.push(...configDiagnostic);
    if (diagnoseListHasSeverity(diagnostic, DiagnoseSeverity.Fatal)) {
        return diagnostic;
    }
    const printerConfig = buildConfig({
        ...(globalConfig.latex ?? {}),
    });
    let macrosContext: Context | undefined = undefined;

    for (const fileInfo of globalConfig.files) {
        const filepath = fileInfo.path;
        const fullFilepath = path.join(rootDir, filepath);

        const outDir = path.join(rootDir, path.dirname(fileInfo.out));
        if (!noEmit) {
            fs.mkdirSync(outDir, { recursive: true });
        }

        const {
            result: printerResult,
            diagnostic: printerDiagnostic,
            context: newMacrosContext,
        } = convertMarkdownFile(fullFilepath, printerConfig, macrosContext);
        diagnostic.push(...printerDiagnostic);
        macrosContext = newMacrosContext;

        if (!noEmit) {
            fs.writeFileSync(
                path.join(rootDir, fileInfo.out),
                printerResult,
                'utf8',
            );
        }
    }

    if (macrosContext) {
        diagnoseContextAll(macrosContext);
        diagnostic.push(...macrosContext.diagnostic);
    }

    return diagnostic;
}

export interface ConvertMarkdownFilesWithDiagnosticData {
    rootDir: string;
    severity: DiagnoseSeverity;
    diagnosticPrint: (message: string) => void;
}

export interface ConvertMarkdownFilesWithDiagnosticResult {
    success: boolean;
}

export function convertMarkdownFilesWithDiagnostic(
    data: ConvertMarkdownFilesWithDiagnosticData,
): ConvertMarkdownFilesWithDiagnosticResult {
    const diagnosticList = convertMarkdownFiles(data.rootDir);
    printDiagnosticList(diagnosticList, data.diagnosticPrint);

    if (diagnoseListHasSeverity(diagnosticList, data.severity)) {
        return {
            success: false,
        };
    }

    return {
        success: true,
    };
}
