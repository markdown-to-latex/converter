import { FileNode, getNodeAllChildren, Node, NodeType } from './nodes';
import { TokenListContainer } from '../lexer/tokens';
import { astProcessTokenList } from './visitors';

function updateASTParents(ast: Node) {
    interface NodeInfo {
        parent: Node | null;
        node: Node;
    }

    const nodeQueue: NodeInfo[] = [];
    nodeQueue.push({
        parent: null,
        node: ast,
    });

    // In-depth AST traverse
    while (nodeQueue.length !== 0) {
        const info = nodeQueue.pop()!;

        // Update parent
        info.node.parent = info.parent;

        nodeQueue.push(
            ...getNodeAllChildren(
                info.node as Parameters<typeof getNodeAllChildren>[0],
            ).map(node => ({
                parent: info.node,
                node: node,
            })),
        );
    }
}

export interface MarkdownASTData {
    filepath?: string;
}

export function buildMarkdownAST(
    tokens: Readonly<TokenListContainer>,
    options: Readonly<MarkdownASTData>,
): FileNode {
    const ast: FileNode = {
        type: NodeType.File,
        parent: null,
        children: astProcessTokenList(tokens),
        path: options.filepath ?? '__not-specified__',
    };
    updateASTParents(ast);

    return ast;
}
