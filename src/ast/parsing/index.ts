import {
    createStartEndPos,
    FileNode,
    NodeE,
    NodeType,
    RawNode,
    RawNodeType,
    StartEndTextPosition,
} from '../node';
import path from 'path';
import { StringE } from '../../extension/string';

export function fullContentPos(content: string | StringE): StartEndTextPosition {
    const contentE = StringE.from(content);

    const lines = contentE.splitE(/\r?\n/);
    return createStartEndPos(
        1,
        1,
        lines.length,
        lines[lines.length - 1].length + 1,
    );
}

function parseFile(content: string, filePath: string) {
    const contentNode: RawNode = {
        type: RawNodeType.Raw,
        parent: null,
        text: content,
        pos: fullContentPos(content),
    };

    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        children: [/*parseNode(contentNode)*/],
        pos: fullContentPos(content),
        path: path.resolve(filePath),
    };

    contentNode.parent = fileNode;

    let nodeE = NodeE.from(fileNode);
}
