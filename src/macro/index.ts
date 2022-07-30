import {
    FileNode,
    Node,
    NodeAbstract,
    NodeE,
    NodeEParentData,
    NodeType,
    OpCodeNode,
    ParagraphNode,
} from '../ast/node';
import { Context, ContextE, initContext } from './context';
import { parseMacro } from './function';
import { processNode } from './node';
import { NodeProcessed } from './node/struct';
import { DiagnoseList } from '../diagnose';

export function applyMacrosFull(
    fileNode: FileNode,
    srcContext?: Context,
): DiagnoseList {
    const { context, diagnostic } = applyMacros(fileNode, srcContext);

    context.diagnostic = [];
    new ContextE(context).diagnoseAll();

    return [...diagnostic, ...context.diagnostic];
}

export interface ApplyMacrosResult {
    context: Context;
    diagnostic: DiagnoseList;
}

export function applyMacros(
    fileNode: FileNode,
    srcContext?: Context,
): ApplyMacrosResult {
    const context = new ContextE(srcContext ?? initContext(fileNode));

    // TODO: maybe make a while for nested macros

    const nodeE = new NodeE(fileNode);

    const iter = nodeE.traverseDeepDepth();
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        context.c.temp.node = data.node.n;
        if (data.node.n.type === NodeType.OpCode) {
            const nodes = parseMacro(
                context,
                data as NodeEParentData<OpCodeNode>,
            );
            data.container.splice(data.index, 1, ...(nodes as Node[]));
            value = iter.next();

            continue;
        }

        const processing = processNode(context, data);
        if (processing) {
            const container = data.container as NodeAbstract[];
            container.splice(data.index, 1, ...processing);
        }
        value = iter.next();
    }

    clearance(fileNode);

    return {
        context: context.c,
        diagnostic: context.c.diagnostic,
    };
}

/**
 * Removed empty paragraphs and commands
 * @param fileNode
 */
function clearance(fileNode: FileNode): void {
    const nodeE = new NodeE(fileNode);

    const iter = nodeE.traverse();
    let value = iter.next();
    while (!value.done) {
        const data = value.value;

        if (data.node.n.type === NodeType.Paragraph) {
            const paragraphNode = data.node.n as ParagraphNode;
            if (paragraphNode.children.length === 0) {
                data.container.splice(data.index, 1);
            }
        }

        if (data.node.n.type === NodeType.Comment) {
            data.container.splice(data.index, 1);
        }

        value = iter.next();
    }
}
