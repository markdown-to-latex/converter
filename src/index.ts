import * as fs from 'fs';
import * as path from 'path';
import { FileNode } from './ast/node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
} from './diagnostic';
import { parseFile } from './ast/parsing';
import { applyMacros } from './macro';
import { FileInfo, validateConfig, YAXMBuild } from './config';
import { Context, diagnoseContextAll } from './macro/context';

export const DEFAULT_CONFIG_NAME = 'md-to-latex-converter.yml';

export interface ReadGlobalConfigResult {
    result: YAXMBuild;
    diagnostic: DiagnoseList;
}

export function readGlobalConfig(
    buildConfig: YAXMBuild,
): ReadGlobalConfigResult {
    const validationResult = validateConfig(buildConfig);
    return {
        result: buildConfig,
        diagnostic: validationResult.errors.map(v => ({
            message: v.message,
            filePath: '__unknown__',
            severity: DiagnoseSeverity.Error,
            pos: {
                start: {
                    line: 1,
                    column: 1,
                    absolute: 0,
                },
                end: {
                    line: 1,
                    column: 1,
                    absolute: 0,
                },
            },
            errorType: DiagnoseErrorType.ConfigError,
        })),
    };
}

export interface ConvertYaxmFileResult {
    fileNode: FileNode;
    context: Context;
    diagnostic: DiagnoseList;
}

export function convertYaxmFile(
    filepath: string,
    macrosContext?: Context,
): ConvertYaxmFileResult {
    const diagnostic: DiagnoseList = [];

    const content = fs.readFileSync(filepath, 'utf8');

    const fileResult = parseFile(content, filepath);
    const fileNode = fileResult.result;
    diagnostic.push(...fileResult.diagnostic);

    const macrosDiagnostic = applyMacros(fileNode, macrosContext);
    diagnostic.push(...macrosDiagnostic.diagnostic);
    macrosDiagnostic.context.diagnostic = [];

    return {
        fileNode,
        context: macrosDiagnostic.context,
        diagnostic,
    };
}

export interface ConvertYaxmFilesArgs {
    rootDir: string;
    buildConfig: YAXMBuild;
    severity?: DiagnoseSeverity;
}

export interface ConvertYaxmFilesFileResult {
    fileInfo: FileInfo;
    fileNode: FileNode;
    success: boolean;
}

export interface ConvertYaxmFilesResult {
    result: ConvertYaxmFilesFileResult[];
    diagnostic: DiagnoseList;
    success: boolean;
}

export function convertYaxmFiles({
    rootDir,
    buildConfig,
    severity,
}: ConvertYaxmFilesArgs): ConvertYaxmFilesResult {
    severity = DiagnoseSeverity.Error;
    const diagnostic: DiagnoseList = [];

    const { result: globalConfig, diagnostic: configDiagnostic } =
        readGlobalConfig(buildConfig);
    diagnostic.push(...configDiagnostic);
    if (diagnoseListHasSeverity(diagnostic, DiagnoseSeverity.Fatal)) {
        return {
            result: [],
            diagnostic,
            success: false,
        };
    }
    let macrosContext: Context | undefined = undefined;

    const result: ConvertYaxmFilesFileResult[] = [];

    for (const fileInfo of globalConfig.files) {
        const filepath = fileInfo.path;
        const fullFilepath = path.join(rootDir, filepath);

        const {
            fileNode: processedFileNode,
            diagnostic: printerDiagnostic,
            context: newMacrosContext,
        } = convertYaxmFile(fullFilepath, macrosContext);
        diagnostic.push(...printerDiagnostic);
        macrosContext = newMacrosContext;

        result.push({
            fileInfo,
            fileNode: processedFileNode,
            success: !diagnoseListHasSeverity(printerDiagnostic, severity),
        });
    }

    if (macrosContext) {
        diagnoseContextAll(macrosContext);
        diagnostic.push(...macrosContext.diagnostic);
    }

    return {
        result,
        diagnostic,
        success: result.find(v => !v.success) === undefined,
    };
}

// --- api

export * as ast from './ast';
export * as config from './config';
export * as diagnostic from './diagnostic';
export * as macro from './macro';
