import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    DiagnoseInfo,
    DiagnoseList,
} from './struct';
import {
    getNodeParentFile,
    Node,
    NodeAbstract,
    positionToTextPosition,
} from '../ast/node';

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

export function printDiagnosticList(
    diagnostic: DiagnoseList,
    printer: (message: string) => void = console.log,
): void {
    for (const diagnose of diagnostic) {
        const message = diagnoseToString(diagnose);
        printer(message);
    }
}

export function diagnoseToString(diag: DiagnoseInfo) {
    let message = diag.message ? `: ${diag.message}` : '';

    // `${diagnose.filePath}:${diagnose.pos.start.line}:${diagnose.pos.start.column} - ${diagnose.severity} ${diagnose.message}`
    return (
        `${diag.filePath}:${diag.pos.start.line}:${diag.pos.start.column} ` +
        `${diag.severity} MD${diag.errorType}${message} `
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
