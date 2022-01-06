import { Node } from '../ast/nodes';
import { Context } from './context';
import { applyPrinterVisitors } from './visitors';

export function printMarkdownAST(rootNode: Node, context: Context): void {
    context = context ?? {};

    applyPrinterVisitors(rootNode, context);
}
