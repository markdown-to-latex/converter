import {
    FileNode,
    Node,
    NodeE,
    NodeEParentData,
    NodeType,
    OpCodeNode, ParagraphNode,
} from '../ast/node';
import {ContextE, initContext} from './context';
import {parseMacro} from './function';
import {processNode} from './node';
import {NodeProcessed} from './node/struct';
import {DiagnoseList} from '../diagnose';

export function applyMacros(fileNode: FileNode): DiagnoseList {
    const context = new ContextE(initContext(fileNode));

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
            const container = data.container as NodeProcessed[];
            container.splice(data.index, 1, ...processing);
        }
        value = iter.next();
    }

    clearance(fileNode);

    context.diagnoseAll();
    return context.c.diagnostic;
}

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
        value = iter.next();
    }
}