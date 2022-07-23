import {
    FileNode,
    NodeType,
    RawNode,
    RawNodeType,
} from '../../../../src/ast/node';
import { applyVisitors } from '../../../../src/ast/parsing/lexer';
import { fileToNode } from '../../../../src';

export function rawNodeTemplate(content: string): RawNode {
    return fileToNode(content, 'test.md');
}

export function snapshotTestTemplate(name: string, content: string) {
    return test(name, () => {
        const rawNode = rawNodeTemplate(content);
        const { nodes, diagnostic } = applyVisitors([rawNode]);

        expect(diagnostic).toMatchSnapshot();
        expect(nodes).toMatchSnapshot();
    });
}
