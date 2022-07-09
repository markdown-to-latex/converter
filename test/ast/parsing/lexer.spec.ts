import {
    CodeNode,
    FileNode,
    NodeType,
    RawNode,
    RawNodeType,
} from '../../../src/ast/node';
import { fullContentPos } from '../../../src/ast/parsing';
import { applyVisitors } from '../../../src/ast/parsing/lexer';

function rawNodeTemplate(content: string): RawNode {
    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        pos: {
            start: 0,
            end: content.length,
        },
        raw: content,
        path: 'test.md',
        children: [],
    };

    const rawNode: RawNode = {
        type: RawNodeType.Raw,
        parent: fileNode,
        pos: {
            start: 0,
            end: content.length,
        },
        text: content,
    };
    fileNode.children.push(rawNode);

    return rawNode;
}

describe('code block lexer check', () => {
    test('Complex raw node', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`
Code block
\`\`\`
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);

        let node = nodes[1] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.text).toEqual('Code block');
        expect(rawNode.text.slice(node.pos.start, node.pos.end)).toEqual(
            '```\nCode block\n```',
        );
        expect(node.parent).toEqual(rawNode.parent);

        expect(nodes).toMatchSnapshot();
    });
    test('With language', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`test-language  
Code block
\`\`\`
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[1] as CodeNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Code);
        expect(node.lang).toEqual('test-language');
    });

    test('Error raw node', () => {
        const rawNode = rawNodeTemplate(`Sample text
\`\`\`
Code block
New sample text
`);
        const { nodes, diagnostic } = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();
    });
});
