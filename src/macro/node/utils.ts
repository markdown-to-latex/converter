import { Node, NodeType, TextNode } from '../../ast/node';

export function fallbackNameNodes(node: Node): Node[] {
    return [
        {
            type: NodeType.Text,
            text: 'Unknown Name',
            parent: node.parent,
            pos: { ...node.pos },
        } as TextNode,
    ];
}
