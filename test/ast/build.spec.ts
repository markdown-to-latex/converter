import { buildMarkdownAST } from '../../src';
import { lexer } from '../../src';
import {
    HeadingNode,
    LinkNode,
    ListItemNode,
    ListNode,
    NodeType,
    ParagraphNode,
    TextNode,
} from '../../src/ast/nodes';

describe('build ast', () => {
    test('simple nodes', () => {
        const result = buildMarkdownAST(
            lexer(`# Header\na\n[Link](link-href)`),
            { filepath: 'filepath' },
        );
        expect(result.path).toEqual('filepath');
        expect(result.type).toEqual(NodeType.File);
        expect(result.parent).toBeNull();
        expect(result.children).toHaveLength(2);

        expect(result.children[0].type).toEqual(NodeType.Heading);
        expect(result.children[1].type).toEqual(NodeType.Paragraph);

        const header = result.children[0] as HeadingNode;
        expect(header.children[0].type).toEqual(NodeType.Text);

        const paragraph = result.children[1] as ParagraphNode;
        expect(paragraph.children).toHaveLength(2);
        expect(paragraph.children[0].type).toEqual(NodeType.Text);
        expect(paragraph.children[1].type).toEqual(NodeType.Link);

        const text = paragraph.children[0] as TextNode;
        expect(text.text).toEqual('a\n');

        const link = paragraph.children[1] as LinkNode;
        expect(link.children).toHaveLength(1);
        expect(link.children[0].type).toEqual(NodeType.Text);
        expect(link.href).toEqual('link-href');
    });

    test('table', () => {});

    test('parent correct', () => {
        const result = buildMarkdownAST(lexer(`- a\n- b\n    - c`), {
            filepath: 'filepath',
        });
        expect(result.children).toHaveLength(1);
        expect(result.parent).toBeNull();

        const list = result.children[0] as ListNode;
        expect(list.children).toHaveLength(2);
        expect(list.parent).toEqual(result);

        const items = list.children as [ListItemNode, ListItemNode];
        expect(items[0].parent).toEqual(list);
        expect(items[1].parent).toEqual(list);

        expect(items[1].children).toHaveLength(2);

        const innerItems = items[1].children as [TextNode, ListNode];
        expect(innerItems[1].children).toHaveLength(1);

        expect(innerItems[0].parent).toEqual(items[1]);
        expect(innerItems[1].parent).toEqual(items[1]);

        const innerListItems = innerItems[1].children as [ListItemNode];
        expect(innerListItems[0].parent).toEqual(innerItems[1]);
    });
});
