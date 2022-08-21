import {
    FileNode,
    NodeType,
    RawNode,
    RawNodeType,
} from '../../../../src/ast/node';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';

export function rawNodeTemplate(content: string): RawNode {
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

export function snapshotTestTemplateInner(content: string) {
    const rawNode = rawNodeTemplate(content);
    const { nodes, diagnostic } = applyVisitors([rawNode]);

    expect(diagnostic).toMatchSnapshot();
    expect(nodes).toMatchSnapshot();
}

export function snapshotTestTemplate(name: string, content: string) {
    return test(name, () => {
        snapshotTestTemplateInner(content);
    });
}
