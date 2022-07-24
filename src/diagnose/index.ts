import {
    copyStartEndPos,
    getNodeParentFile,
    Node,
    NodeAbstract,
} from '../ast/node';
import path from 'path';
import {
    positionToTextPosition,
    StartEndPosition,
    StartEndTextPosition,
    TextPosition,
    textPositionToString,
} from '../ast/node/position';

export enum DiagnoseSeverity {
    Fatal = 'FATAL', // The app cannot continue
    Error = 'ERROR', // The app can complete the current step and then exit
    Warning = 'WARNING', // Should be fixed
    Info = 'INFO', // Just info
}

const severityToPriority: {
    [key in DiagnoseSeverity]: number;
} = {
    [DiagnoseSeverity.Fatal]: 5,
    [DiagnoseSeverity.Error]: 4,
    [DiagnoseSeverity.Warning]: 3,
    [DiagnoseSeverity.Info]: 2,
};

/**
 * Is left severity greater or equal than right.
 *
 * `left >= right`
 *
 * @param left Left operand
 * @param right Right operand
 */
export function isSeverityGEq(left: DiagnoseSeverity, right: DiagnoseSeverity) {
    return severityToPriority[left] >= severityToPriority[right];
}

export enum DiagnoseErrorType {
    ApplyParserError,
    InternalError,
    ContextError,
    MacrosError,
    PrinterError,
    LatexPrinterError,
    OtherError,
}

export interface DiagnosePosition extends TextPosition {
    absolute: number;
}

export type DiagnoseStartEndPosition = StartEndPosition<DiagnosePosition>;

export interface DiagnoseInfo {
    severity: DiagnoseSeverity;
    errorType: DiagnoseErrorType;
    pos: DiagnoseStartEndPosition;
    filePath: string;
    message?: string;
}

export type DiagnoseList = DiagnoseInfo[];

export function diagnoseToString(diag: DiagnoseInfo) {
    let message = diag.message ? `: ${diag.message}` : '';
    return (
        `${diag.errorType} MD${diag.errorType}${message} ` +
        `at ${textPositionToString(diag.pos.start)} - ` +
        `${textPositionToString(diag.pos.end)} in ${diag.filePath}`
    );
}

export function nodeToDiagnose(
    node: NodeAbstract,
    severity: DiagnoseSeverity,
    errorType: DiagnoseErrorType,
    message?: string,
): DiagnoseInfo {
    const fileNode = getNodeParentFile(node);
    const rawText = fileNode?.raw ?? '';

    return {
        errorType,
        severity,
        message,
        filePath: fileNode?.path ?? 'null',
        pos: {
            start: {
                absolute: node.pos.start,
                ...positionToTextPosition(rawText, node.pos.start),
            },
            end: {
                absolute: node.pos.end,
                ...positionToTextPosition(rawText, node.pos.end),
            },
        },
    };
}

export function nodesToDiagnose(
    nodes: Node[],
    severity: DiagnoseSeverity,
    errorType: DiagnoseErrorType,
    message?: string,
): DiagnoseInfo {
    if (nodes.length === 0) {
        return {
            errorType: DiagnoseErrorType.InternalError,
            severity: DiagnoseSeverity.Fatal,
            message: 'No nodes passed into nodesToDiagnose',
            filePath: 'null',
            pos: {
                start: {
                    absolute: 0,
                    ...positionToTextPosition('', 0),
                },
                end: {
                    absolute: 0,
                    ...positionToTextPosition('', 0),
                },
            },
        };
    }

    if (nodes.length === 1) {
        return nodeToDiagnose(nodes[0], severity, errorType, message);
    }

    const firstNode = nodes[0];
    const lastNode = nodes[nodes.length - 1];

    const file = getNodeParentFile(firstNode);
    return {
        errorType,
        severity,
        message,
        filePath: file?.path ?? 'null',
        pos: {
            start: {
                absolute: firstNode.pos.start,
                ...positionToTextPosition(file?.raw ?? '', firstNode.pos.start),
            },
            end: {
                absolute: lastNode.pos.end,
                ...positionToTextPosition(file?.raw ?? '', lastNode.pos.end),
            },
        },
    };
}

export function diagnoseListHasSeverity(
    list: DiagnoseInfo[],
    severity: DiagnoseSeverity,
): boolean {
    for (const diag of list) {
        if (isSeverityGEq(diag.severity, severity)) {
            return true;
        }
    }

    return false;
}
