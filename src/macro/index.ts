import {
    FileNode,
    NodeE,
    NodeEParentData,
    NodeType,
    OpCodeNode,
} from '../ast/node';
import { ContextE, initContext } from '../context';
import { parseMacro } from './function';

export function applyMacros(fileNode: FileNode): void {
    const context = new ContextE(initContext(fileNode));

    // TODO: maybe make a while for nested macros

    const nodeE = new NodeE(fileNode);
    const allNodes = Array.from(nodeE.traverse()).filter(
        d => d.node.n.type === NodeType.OpCode,
    ) as NodeEParentData<OpCodeNode>[];
    for (const data of allNodes) {
        context.c.temp.node = data.node.n;

        const nodes = parseMacro(context, data);
        data.container.splice(data.index, 1, ...nodes);
    }
}
