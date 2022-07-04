import * as node from '../node';
import {
    CodeNode,
    copyTextPosition,
    createStartEndPos,
    Node,
    NodeType,
    RawNode,
    RawNodeE,
    RawNodeType,
    TextPosition,
    textPositionG,
    textPositionGEq,
} from '../node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
} from '../../diagnose';

export const enum LexemeType {
    // Space,
    // Paragraph,
    // Heading,
    // Text,
    Code,
}

const parserPriorities: LexemeType[] = [
    LexemeType.Code,
    // LexemeType.Heading,
    // LexemeType.Paragraph,
    // LexemeType.Text,
    // LexemeType.Space,
];

interface LexemeTypeToNodeType {
    [LexemeType.Code]: node.CodeNode;
    // [LexemeType.Heading]: node.HeadingNode;
    // [LexemeType.Paragraph]: node.ParagraphNode;
    // [LexemeType.Text]: node.TextNode;
    // [LexemeType.Space]: node.SpaceNode;
}

class FatalError extends Error {
}

export function applyVisitors(nodes: Readonly<Node[]>): [Node[], DiagnoseList] {
    let allDiags: DiagnoseList = [];

    let newNodes = [...nodes];
    try {
        for (const type of parserPriorities) {
            newNodes = newNodes.flatMap(node => {
                if (node.type !== RawNodeType.Raw) {
                    return [node];
                }

                let [nodes, diags] = applyParser(node as RawNode, type);
                allDiags.push(...diags);

                if (diagnoseListHasSeverity(diags, DiagnoseSeverity.Fatal)) {
                    throw new FatalError();
                }

                return nodes;
            });
        }
    } catch (e) {
        if (e instanceof FatalError) {
            return [[], allDiags];
        } else {
            throw e;
        }
    }

    return [newNodes, allDiags];
}

function applyParser(
    node: Readonly<RawNode>,
    type: LexemeType,
): [Node[], DiagnoseList] {
    const nodeE = new RawNodeE(node);

    const diags: DiagnoseList = [];
    const newNodes: Node[] = [];
    let position: TextPosition = copyTextPosition(node.pos.start);

    const parsed = parsers[type](nodeE);
    for (const node of parsed) {
        if (!textPositionGEq(position, node.pos.start)) {
            newNodes.push({
                type: RawNodeType.Raw,
                pos: {
                    start: copyTextPosition(position),
                    end: copyTextPosition(node.pos.start),
                },
                text: nodeE.text.slicePosition(
                    nodeE.n.pos.start,
                    position,
                    node.pos.start,
                ).s,
                parent: nodeE.n.parent,
            } as RawNode);
        }

        newNodes.push(node);
        position = copyTextPosition(node.pos.end);
    }

    if (!textPositionGEq(position, node.pos.end)) {
        newNodes.push({
            type: RawNodeType.Raw,
            pos: {
                start: copyTextPosition(position),
                end: copyTextPosition(node.pos.end),
            },
            text: nodeE.text.slicePosition(
                nodeE.n.pos.start,
                position,
                node.pos.end,
            ).s,
            parent: nodeE.n.parent,
        } as RawNode);
    } else if (textPositionG(position, node.pos.end)) {
        diags.push({
            errorType: DiagnoseErrorType.ApplyParserError,
            severity: DiagnoseSeverity.Fatal,
            pos: {
                start: node.pos.end,
                end: position,
            },
            message: 'Parser position overflow',
            filePath: nodeE.parentFile?.path ?? 'null',
        });
    }

    return [newNodes, diags];
}

type Visitor<T> = (node: RawNodeE) => T[];
const parsers: {
    [key in LexemeType]: Visitor<LexemeTypeToNodeType[key]>;
} = {
    [LexemeType.Code]: node => {
        const lines = node.text.lines;

        const codeLexemes = lines
            .map((v, i) => ({
                offLine: i,
                absLine: node.n.pos.start.line + i,
                match: v.s.match(/\s*`{3,}/),
            }))
            .filter(v => v.match?.length);
        if (codeLexemes.length % 2 !== 0) {
            const lastLexeme = codeLexemes[codeLexemes.length - 1];
            const absLine = lastLexeme.absLine;
            throw new Error(
                `Unable to find closing quotes for block code. ` +
                `Began at ${absLine} at file TODO`,
            );
        }

        const codeNodes: CodeNode[] = [];
        for (let i = 0; i < codeLexemes.length; i += 2) {
            const startLexeme = codeLexemes[i];
            const endLexeme = codeLexemes[i + 1];

            const text = lines
                .slice(startLexeme.offLine + 1, endLexeme.offLine)
                .join('\n');
            codeNodes.push({
                type: NodeType.Code,
                pos: createStartEndPos(
                    startLexeme.absLine,
                    1,
                    endLexeme.absLine,
                    lines[endLexeme.offLine].length,
                ),
                text: text,
                parent: node.n.parent,
                lang: null,
                codeBlockStyle: null,
            });
        }

        return codeNodes;
    },
};
