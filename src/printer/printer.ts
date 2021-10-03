import { Node } from '../ast/nodes';
import { Context, WriteFileFunction } from './context';
import { applyPrinterVisitors } from './visitors';

export function printMarkdownAST(rootNode: Node, context: Context): void {
    context = context ?? {};

    applyPrinterVisitors(rootNode, context);
}
