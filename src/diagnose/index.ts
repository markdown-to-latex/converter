import { copyStartEndPos, getNodeParentFile, Node } from '../ast/node';
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
    node: Node,
    severity: DiagnoseSeverity,
    errorType: DiagnoseErrorType,
    message?: string,
): DiagnoseInfo {
    return {
        errorType,
        severity,
        message,
        filePath: getNodeParentFile(node)?.path ?? 'null',
        pos: {
            start: {
                absolute: node.pos.start,
                ...positionToTextPosition(
                    getNodeParentFile(node)?.raw ?? '',
                    node.pos.start,
                ),
            },
            end: {
                absolute: node.pos.end,
                ...positionToTextPosition(
                    getNodeParentFile(node)?.raw ?? '',
                    node.pos.end,
                ),
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
