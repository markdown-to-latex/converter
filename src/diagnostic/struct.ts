import { StartEndPosition, TextPosition } from '../ast/node';

export enum DiagnoseSeverity {
    Fatal = 'FATAL', // The app cannot continue
    Error = 'ERROR', // The app can complete the current step and then exit
    Warning = 'WARNING', // Should be fixed
    Info = 'INFO', // Just info
}

export enum DiagnoseErrorType {
    ApplyParserError,
    InternalError,
    ContextError,
    MacrosError,
    PrinterError,
    LatexPrinterError,
    ConfigError,
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
