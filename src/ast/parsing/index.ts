import {
    createStartEndTextPos,
    FileNode,
    NodeE,
    NodeType,
    RawNode,
    RawNodeType,
    StartEndTextPosition,
} from '../node';
import path from 'path';
import { StringE } from '../../extension/string';
import { applyVisitors } from './lexer';
import { DiagnoseList } from '../../diagnose';
import { LINE_SPLIT_REGEXP } from '../../extension/regexp';

export function fullContentPos(
    content: string | StringE,
): StartEndTextPosition {
    const contentE = StringE.from(content);

    const lines = contentE.splitE(LINE_SPLIT_REGEXP);
    return createStartEndTextPos(
        1,
        1,
        lines.length,
        lines[lines.length - 1].length + 1,
    );
}

export interface ParseFileResult {
    result: FileNode;
    diagnostic: DiagnoseList;
}

export function parseFile(content: string, filePath: string): ParseFileResult {
    const contentNode: RawNode = {
        type: RawNodeType.Raw,
        parent: null,
        text: content,
        pos: {
            start: 0,
            end: content.length,
        },
    };

    const fileNode: FileNode = {
        type: NodeType.File,
        parent: null,
        children: [contentNode],
        pos: {
            start: 0,
            end: content.length,
        },
        raw: content,
        path: path.resolve(filePath),
    };

    contentNode.parent = fileNode;

    const result = applyVisitors([contentNode]);
    fileNode.children = result.nodes;

    return {
        result: fileNode,
        diagnostic: result.diagnostic,
    };
}
