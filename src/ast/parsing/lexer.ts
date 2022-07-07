import * as node from '../node';
import {
    CodeNode,
    createStartEndTextPos,
    Node,
    NodeType,
    positionToTextPosition,
    RawNode,
    RawNodeE,
    RawNodeType,
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
    let position = node.pos.start;

    const parsed = parsers[type](nodeE);
    for (const node of parsed) {
        if (position < node.pos.start) {
            newNodes.push({
                type: RawNodeType.Raw,
                pos: {
                    start: position,
                    end: node.pos.start,
                },
                text: nodeE.n.text.slice(position, node.pos.start),
                parent: nodeE.n.parent,
            } as RawNode);
        }

        newNodes.push(node);
        position = node.pos.end;
    }

    if (position < node.pos.end) {
        newNodes.push({
            type: RawNodeType.Raw,
            pos: {
                start: position,
                end: node.pos.end,
            },
            text: nodeE.n.text.slice(position, node.pos.start),
            parent: nodeE.n.parent,
        } as RawNode);
    } else if (position > node.pos.end) {
        diags.push({
            errorType: DiagnoseErrorType.ApplyParserError,
            severity: DiagnoseSeverity.Fatal,
            pos: {
                start: {
                    absolute: node.pos.end,
                    ...positionToTextPosition(
                        nodeE.parentFile?.raw ?? '',
                        node.pos.end,
                    ),
                },
                end: {
                    absolute: position,
                    ...positionToTextPosition(
                        nodeE.parentFile?.raw ?? '',
                        position,
                    ),
                },
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
        const lines = node.text.getLinesWithTextPositions(node.n.pos.start);

        const codeLexemes = lines
            .map((v, i) => ({
                ...v,
                offLine: i,
                match: v.str.match(/(\s*)`{3,}([\w\d]*)/),
            }))
            .filter(v => v.match?.length);
        if (codeLexemes.length % 2 !== 0) {
            const lastLexeme = codeLexemes[codeLexemes.length - 1];
            throw new Error(
                `Unable to find closing quotes for block code. ` +
                `Began at post ${lastLexeme.pos} at file TODO`,
            );
        }

        const codeNodes: CodeNode[] = [];
        for (let i = 0; i < codeLexemes.length; i += 2) {
            const startLexeme = codeLexemes[i];
            const endLexeme = codeLexemes[i + 1];

            const text = lines
                .map(v => v.str)
                .slice(startLexeme.offLine + 1, endLexeme.offLine)
                .join('\n');

            codeNodes.push({
                type: NodeType.Code,
                pos: {
                    start: startLexeme.pos,
                    end: endLexeme.pos + endLexeme.str.length,
                },
                text: text,
                parent: node.n.parent,
                lang: null,
                codeBlockStyle: null,
            });
        }

        return codeNodes;
    },
};
