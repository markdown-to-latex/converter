import { FileNode, NodeType, RawNode, RawNodeType } from '../../../src/ast/node';
import { fullContentPos } from '../../../src/ast/parsing';
import { applyVisitors } from '../../../src/ast/parsing/lexer';

function rawNodeTemplate(content: string): RawNode {
    const pos = fullContentPos(content);
    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        pos: pos,
        path: 'test.md',
        children: [],
    };

    const rawNode: RawNode = {
        type: RawNodeType.Raw,
        parent: fileNode,
        pos: pos,
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
`,
        );
        const [result, diagnose] = applyVisitors([rawNode]);
        expect(diagnose).toHaveLength(0);
        expect(result).toMatchSnapshot();
    });
});
