import { Node, NodeAbstract, RawNode } from '../ast/node';
import { DiagnoseList } from '../diagnose';
import { NodeProcessed } from '../macro/node';

export interface PrinterVisitorResult {
    result: string;
    diagnostic: DiagnoseList;
}

export type PrinterVisitor<T = NodeAbstract> = (
    printer: Printer,
    node: T,
) => PrinterVisitorResult;

export type PrinterVisitorList<T = NodeAbstract> = (
    printer: Printer,
    node: T[],
    separator?: string,
) => PrinterVisitorResult;

export interface PrinterConfiguration {}

export interface Printer {
    config: PrinterConfiguration;

    processNode: PrinterVisitor;
    processNodeList: PrinterVisitorList;
}
