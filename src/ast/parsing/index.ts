import {
    createStartEndTextPos,
    FileNode,
    NodeType,
    RawNode,
    RawNodeType,
    StartEndTextPosition,
} from '../node';
import path from 'path';
import { applyVisitors } from './lexer';
import { DiagnoseList } from '../../diagnostic';
import { LINE_SPLIT_REGEXP } from './tokenizer';

export function fullContentPos(content: string): StartEndTextPosition {
    const lines = content.split(LINE_SPLIT_REGEXP);
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

// --- api

export * as lexer from './lexer';
export * as tokenizer from './tokenizer';
