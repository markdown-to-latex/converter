import {
    Printer,
    PrinterConfiguration,
    PrinterVisitor,
    PrinterVisitorList,
    PrinterVisitorResult,
} from '../struct';
import { NodeProcessed, ProcessedNodeType } from '../../macro/node/struct';
import { DiagnoseList } from '../../diagnose';
import { NodesByType } from '../../ast/nodes';
import { ProcessedNodesByType } from '../../macro/nodes';
import {
    LatexPrinterVisitor,
    LatexPrinterVisitorList,
    ProcessingVisitors,
    processingVisitors,
} from './visitors';
import { Node, NodeAbstract, RawNode } from '../../ast/node';
import { buildConfig, LatexPrinterConfiguration } from './config';

const processNode: LatexPrinterVisitor<NodeProcessed | RawNode | Node> =
    function (printer, node) {
        return processingVisitors[node.type](
            printer,
            /* TODO: resolve that */ node as any,
        );
    };

const processNodeList: LatexPrinterVisitorList<NodeProcessed | RawNode | Node> =
    function (printer, nodes, separator = '') {
        const processedNodes = nodes.map(node =>
            printer.processNode(printer, node),
        );

        const diagnostic: DiagnoseList = processedNodes.flatMap(
            nodes => nodes.diagnostic,
        );
        const result: string = processedNodes
            .map(nodes => nodes.result)
            .join(separator);

        return {
            result,
            diagnostic,
        };
    };

export interface LatexPrinter {
    processNode: LatexPrinterVisitor<NodeProcessed | RawNode | Node>;
    processNodeList: LatexPrinterVisitorList<NodeProcessed | RawNode | Node>;

    processingVisitors: ProcessingVisitors;
    config: LatexPrinterConfiguration;
}

export function createLatexPrinter(
    config: LatexPrinterConfiguration,
): LatexPrinter {
    return {
        processingVisitors,
        config: config,

        processNode,
        processNodeList,
    };
}

export { buildConfig };
