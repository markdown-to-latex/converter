import {
    copyStartEndPos,
    getNodeParentFile,
    Node, StartEndTextPosition,
    TextPosition,
    textPositionToString,
} from '../ast/node';
import path from 'path';

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

export interface DiagnoseInfo {
    severity: DiagnoseSeverity;
    errorType: DiagnoseErrorType;
    pos: StartEndTextPosition;
    filePath: string;
    message?: string;
}

export type DiagnoseList = DiagnoseInfo[];

export function diagnoseToString(diag: DiagnoseInfo) {
    let message = diag.message ? `: ${diag.message}` : '';
    return (
        `${diag.errorType} MD${diag.errorType}${message} ` +
        `at ${textPositionToString(diag.pos.start)} in ${diag.filePath}`
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
        pos: copyStartEndPos(node.pos),
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
