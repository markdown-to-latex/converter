import * as node from '../../node';
import {
    CodeNode,
    getNodeParentFile,
    Node,
    NodeE,
    NodeType,
    positionToTextPosition,
    RawNode,
    RawNodeType,
    TextNode,
    TokensNode
} from '../../node';
import {
    DiagnoseErrorType,
    DiagnoseInfo,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
} from '../../../diagnose';
import {Token, tokenize, tokensToNode, TokenType} from '../tokenizer';
import {TokenByTypeParserResult, TokenParser, TokenPredicate} from "./struct";
import {isCode, parseCode} from "./node/code";
import {TokenByType} from "../../../lexer/tokens";

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

interface ApplyVisitorsResult {
    nodes: Node[];
    diagnostic: DiagnoseList;
}

export function applyVisitors(nodes: Readonly<Node[]>): ApplyVisitorsResult {
    const visitorsResult: ApplyVisitorsResult = {
        nodes: [...nodes],
        diagnostic: [],
    }

    try {
        for (const type of parserPriorities) {
            visitorsResult.nodes = visitorsResult.nodes.flatMap(node => {
                if (node.type === RawNodeType.Raw) {
                    const parent = node.parent
                    node = tokensToNode(tokenize((node as RawNode).text, 0));
                    node.parent = parent
                }

                if (node.type !== RawNodeType.Tokens) {
                    return [node];
                }

                const result = parseTokensNode(node as TokensNode);
                visitorsResult.diagnostic.push(...result.diagnostic);

                if (
                    diagnoseListHasSeverity(
                        result.diagnostic,
                        DiagnoseSeverity.Fatal,
                    )
                ) {
                    throw new FatalError();
                }

                return result.nodes;
            });
        }
    } catch (e) {
        if (e instanceof FatalError) {
            return visitorsResult;
        } else {
            throw e;
        }
    }

    return visitorsResult;
}

/*
function applyParser(
    node: Readonly<TokensNode>,
    type: LexemeType,
): [Node[], DiagnoseList] {
    const nodeE = NodeE.from(node);

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
*/

type Visitor<T> = (node: NodeE<TokensNode>) => T[];

interface FindTokenResult {
    token: Token;
    index: number;
}

export function findTokenOrNull(
    tokens: TokensNode,
    fromIndex: number,
    predicate: TokenPredicate,
): FindTokenResult | null {
    for (let i = fromIndex; i < tokens.tokens.length; ++i) {
        const token = tokens.tokens[i];
        if (predicate(token, i, tokens)) {
            return {
                token,
                index: i,
            };
        }
    }
    return null;
}

export function findTokenOrNullBackward(
    tokens: TokensNode,
    fromIndex: number,
    predicate: TokenPredicate,
): FindTokenResult | null {
    for (let i = fromIndex; i >= 0; --i) {
        const token = tokens.tokens[i];
        if (predicate(token, i, tokens)) {
            return {
                token,
                index: i,
            };
        }
    }
    return null;
}

interface ParseTokensNodeResult {
    nodes: Node[];
    diagnostic: DiagnoseList;
}

export function parseTokensNode(tokens: TokensNode): ParseTokensNodeResult {
    const parsingResult: ParseTokensNodeResult = {
        nodes: [],
        diagnostic: [],
    };

    for (let i = 0; i < tokens.tokens.length /*manual*/;) {
        const token = tokens.tokens[i];

        const result = parseTokensNodeByType(tokens, i);
        if (result) {
            i = result.index;
            parsingResult.diagnostic.push(...result.diagnostic);
            parsingResult.nodes.push(...result.nodes);

            if (
                diagnoseListHasSeverity(
                    result.diagnostic,
                    DiagnoseSeverity.Fatal,
                )
            ) {
                return parsingResult;
            }

            continue;
        }

        // Nothing
        const lastNode = parsingResult.nodes.length ? parsingResult.nodes[parsingResult.nodes.length - 1] : null;
        if (lastNode?.type === NodeType.Text) {
            lastNode.pos.end = token.pos + token.text.length;
            (lastNode as TextNode).text += token.text;
        } else {
            parsingResult.nodes.push({
                type: NodeType.Text,
                parent: tokens.parent,
                text: token.text,
                pos: {
                    start: token.pos,
                    end: token.pos + token.text.length,
                },
                children: [],
            } as TextNode)
        }
        ++i;
    }

    return parsingResult;
}

function parseTokensNodeByType(tokens: TokensNode, index: number): TokenByTypeParserResult | null {
    const token = tokens.tokens[index];

    for (const parser of parsersByType[token.type]) {
        const result = parser(tokens, index);
        if (result) {
            return result;
        }
    }

    return null;
}

const parsersByType: Record<TokenType, TokenParser[]> = {
    [TokenType.JoinableSpecial]: [
        parseCode,
    ],
    [TokenType.SeparatedSpecial]: [],
    [TokenType.Delimiter]: [],
    [TokenType.Spacer]: [],
    [TokenType.Letter]: [],
    [TokenType.Other]: [],
}

export function tokenToDiagnose(
    tokens: TokensNode,
    index: number,
    message: string,
    severity: DiagnoseSeverity = DiagnoseSeverity.Fatal,
): DiagnoseInfo {
    const token = tokens.tokens[index];
    const nodeParentFile = getNodeParentFile(tokens);
    return {
        message: message,
        severity: severity,
        filePath: nodeParentFile?.path ?? 'null',
        errorType: DiagnoseErrorType.ApplyParserError,
        pos: {
            start: {
                absolute: token.pos,
                ...positionToTextPosition(nodeParentFile?.raw ?? '', token.pos),
            },
            end: {
                absolute: token.pos + token.text.length,
                ...positionToTextPosition(
                    nodeParentFile?.raw ?? '',
                    token.pos + token.text.length,
                ),
            },
        },
    };
}
