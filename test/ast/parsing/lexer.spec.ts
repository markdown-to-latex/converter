import {
    CodeNode,
    CodeSpanNode,
    FileNode,
    HeadingNode,
    LinkNode,
    ListNode,
    NodeType,
    OpCodeNode,
    ParagraphNode,
    RawNode,
    RawNodeType,
    TableNode,
} from '../../../src/ast/node';
import {fullContentPos} from '../../../src/ast/parsing';
import {applyVisitors} from '../../../src/ast/parsing/lexer';

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
        const {nodes, diagnostic} = applyVisitors([rawNode]);
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
        const {nodes, diagnostic} = applyVisitors([rawNode]);
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
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();
    });
});

describe('link check', () => {
    test('Simple Link in text', () => {
        const rawNode = rawNodeTemplate('Hello [ti t le](li-nk) text');
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[1].type).toEqual(NodeType.Link);

        expect(nodes).toMatchSnapshot();
    });

    test('Link with inner md in text', () => {
        const rawNode = rawNodeTemplate('Hello [ti \n`co][de` le](li-nk) text');
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        const linkNode = node.children[1] as LinkNode;
        expect(linkNode.type).toEqual(NodeType.Link);
        let codeSpan = linkNode.children[1] as CodeSpanNode;
        expect(codeSpan).not.toBeUndefined();
        expect(codeSpan.type).toEqual(NodeType.CodeSpan);

        expect(nodes).toMatchSnapshot();
    });
});

describe('macros parsing', () => {
    test('Complex macros with name, label, pos and key args', () => {
        const rawNode = rawNodeTemplate(
            '!Macro[label-text](pos arg 1)(`pos arg` 2)(@keyArgName argName)',
        );
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('Key is defined wrongly', () => {
        const rawNode = rawNodeTemplate('!Macro(@key)(@)');
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });

    test('Multiple keys error', () => {
        const rawNode = rawNodeTemplate(
            '!Macro(@key value)(@key another value)',
        );
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);

        const errText = rawNode.text.slice(
            diagnostic[0].pos.start.absolute,
            diagnostic[0].pos.end.absolute,
        );
        expect(errText).toEqual('key');
    });

    test('Brackets mismatch', () => {
        const rawNode = rawNodeTemplate(
            '!Macro[(@key ]value)(@key another value)',
        );
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ParagraphNode;
        expect(node).not.toBeUndefined();
        expect(node.children[0].type).toEqual(NodeType.OpCode);

        expect(nodes).toMatchSnapshot();
    });
});

describe('table parsing', () => {
    test('Simple table', () => {
        const rawNode = rawNodeTemplate(`| Column 1 | Column 2 |
| -------- | -------- |
| Value **1** | Value \`2\` |
|Value [with](link) | |`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as TableNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.Table);

        expect(nodes).toMatchSnapshot();
    });
});

describe('List parsing', () => {
    test('Simple ordered list', () => {
        const rawNode = rawNodeTemplate(`1. Text 1
2. Text \`2\`
3. **Text** 3`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with multiline items', () => {
        const rawNode = rawNodeTemplate(`1. Text 1
Additional text 1
2. Text \`2\`
3. **Text** 3
   Additional text 3`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with list', () => {
        const rawNode = rawNodeTemplate(`3. Text 1
Additional text 1
    * Item
    * Next Item
        - One more item \`:)\`
    * Conclusion
4. Text \`2\`
5. **Text** 3`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        let node = nodes[0] as ListNode;
        expect(node).not.toBeUndefined();
        expect(node.type).toEqual(NodeType.List);

        expect(nodes).toMatchSnapshot();
    });

    test('List with text after', () => {
        const rawNode = rawNodeTemplate(`3. Text 1

Text`);

        // TODO: wrong
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        expect(nodes[0].type).toEqual(NodeType.List);
        const paragraphNode = nodes[1] as ParagraphNode;
        expect(paragraphNode.type).toEqual(NodeType.Paragraph);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Heading parsing', () => {
    test('Multi-level heading parsing', () => {
        const rawNode = rawNodeTemplate(`# Header 1
## Header \`2\`
### Header 3
#### Header 4`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        for (const absNode of nodes) {
            let node = absNode as HeadingNode;
            expect(node).not.toBeUndefined();
            expect(node.type).toEqual(NodeType.Heading);
        }

        expect(nodes).toMatchSnapshot();
    });

    test('Header with text parsing', () => {
        const rawNode = rawNodeTemplate(`# Header 1

Text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Blockquote parsing', () => {
    test('Multi-level blockquote parsing', () => {
        const rawNode = rawNodeTemplate(`> Line 1
> Line 2
> Line 3
Text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(2);
        expect(nodes[0].type).toEqual(NodeType.Blockquote);
        const paragraphNode = nodes[1] as ParagraphNode;
        expect(paragraphNode.type).toEqual(NodeType.Paragraph);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Hr parsing', function () {
    test('Default hr', () => {
        const rawNode = rawNodeTemplate(`
-----
`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].type).toEqual(NodeType.Hr);

        expect(nodes).toMatchSnapshot();
    });

    test('HR with text', () => {
        const rawNode = rawNodeTemplate(`
Text 1
-----
Text 2
`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(3);
        expect(nodes[0].type).toEqual(NodeType.Paragraph);
        expect(nodes[1].type).toEqual(NodeType.Hr);
        expect(nodes[2].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Image parsing', () => {
    test('Markdown-like image', () => {
        const rawNode = rawNodeTemplate('![image-label](../../image.png)');
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(1);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Image);

        expect(nodes).toMatchSnapshot();
    });

    test('Extended image', () => {
        const rawNode = rawNodeTemplate(`![image-label](../../image.png)(
    Image Name
)(
    14cm
)`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(1);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Image);

        expect(nodes).toMatchSnapshot();
    });

    test('Image args error', () => {
        const rawNode = rawNodeTemplate(`![image-label](../../image.png)(
    Image Name
)(@name 
    Another name
)`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(1);
        expect(diagnostic).toMatchSnapshot();
    });
});

describe('Em parsing', () => {
    test('Em in text', () => {
        const rawNode = rawNodeTemplate(`Text with *em text*-text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('Em in text with sub-node', () => {
        const rawNode = rawNodeTemplate(`Text with *em\`code\` text*-text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Strong parsing', () => {
    test('Simple strong', () => {
        const rawNode = rawNodeTemplate(`Text with **strong text**-text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(3);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Strong);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });

    test('Strong and strong-em', () => {
        const rawNode = rawNodeTemplate(
            `Text *em **strong** text* with **strong *em* text**-text`,
        );
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        const paragraphNode = nodes[0] as ParagraphNode;
        expect(paragraphNode.children).toHaveLength(5);
        expect(paragraphNode.children[0].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[1].type).toEqual(NodeType.Em);
        expect(paragraphNode.children[2].type).toEqual(NodeType.Text);
        expect(paragraphNode.children[3].type).toEqual(NodeType.Strong);
        expect(paragraphNode.children[4].type).toEqual(NodeType.Text);

        expect(nodes).toMatchSnapshot();
    });
});

describe('Paragraph parsing', () => {
    test('Complex', () => {
        const rawNode = rawNodeTemplate(`## Not a paragraph
Text with **strong text**-text  
With BR break

New paragraph via break
1. List  
item 1
2. List item 3

----

## Not a paragraph 2
text`);
        const {nodes, diagnostic} = applyVisitors([rawNode]);
        expect(diagnostic).toHaveLength(0);
        expect(nodes).toHaveLength(7);
        expect(nodes[0].type).toEqual(NodeType.Heading);
        expect(nodes[1].type).toEqual(NodeType.Paragraph);
        expect(nodes[2].type).toEqual(NodeType.Paragraph);
        expect(nodes[3].type).toEqual(NodeType.List);
        expect(nodes[4].type).toEqual(NodeType.Hr);
        expect(nodes[5].type).toEqual(NodeType.Heading);
        expect(nodes[6].type).toEqual(NodeType.Paragraph);

        expect(nodes).toMatchSnapshot();
    });
});
