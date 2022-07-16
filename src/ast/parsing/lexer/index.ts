import * as node from "../../node";
import {
    getNodeParentFile,
    Node,
    NodeChildren,
    NodeText,
    NodeType,
    positionToTextPosition,
    RawNode,
    RawNodeType,
    TextNode,
    TokensNode
} from "../../node";
import {
    DiagnoseErrorType,
    DiagnoseInfo,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity
} from "../../../diagnose";
import { Token, tokenize, tokensToNode, TokenType } from "../tokenizer";
import { TokenByTypeParserResult, TokenParser, TokenPredicate } from "./struct";
import { parseCode } from "./node/code";
import {
    isParagraphBreak,
    parseParagraphBreak,
    parseSoftBreak
} from "./node/paragraph";
import { parseCodeSpan } from "./node/codeSpan";
import { parseLink } from "./node/link";
import { parseMacro } from "./node/macros";
import { parseTable } from "./node/table";
import { parseList } from "./node/list";
import { parseHeading } from "./node/heading";
import { parseBlockquote } from "./node/blockquote";
import { parseImage } from "./node/image";
import { parseHr } from "./node/hr";
import { parseEm } from "./node/em";
import { parseStrongWithOptionalEm } from "./node/strong";

export const enum LexemeType {
    // Space,
    // Paragraph,
    // Heading,
    // Text,
    Code,
}

const parserPriorities: LexemeType[] = [
    LexemeType.Code
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
        diagnostic: []
    };

    try {
        for (const type of parserPriorities) {
            visitorsResult.nodes = visitorsResult.nodes.flatMap(node => {
                if (node.type === RawNodeType.Raw) {
                    const parent = node.parent;
                    node = tokensToNode(tokenize((node as RawNode).text, 0));
                    node.parent = parent;
                }

                if (node.type !== RawNodeType.Tokens) {
                    return [node];
                }

                const result = parseTokensNode(node as TokensNode);
                visitorsResult.diagnostic.push(...result.diagnostic);

                if (
                    diagnoseListHasSeverity(
                        result.diagnostic,
                        DiagnoseSeverity.Fatal
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

interface FindTokenResult {
    token: Token;
    index: number;
}

export function findTokenOrNull(
    tokens: TokensNode,
    fromIndex: number,
    predicate: TokenPredicate
): FindTokenResult | null {
    for (let i = fromIndex; i < tokens.tokens.length; ++i) {
        const token = tokens.tokens[i];
        if (predicate(token, i, tokens)) {
            return {
                token,
                index: i
            };
        }
    }
    return null;
}

export function findTokenOrNullBackward(
    tokens: TokensNode,
    fromIndex: number,
    predicate: TokenPredicate
): FindTokenResult | null {
    for (let i = fromIndex; i >= 0; --i) {
        const token = tokens.tokens[i];
        if (predicate(token, i, tokens)) {
            return {
                token,
                index: i
            };
        }
    }
    return null;
}

const brackets: Record<string, string> = {
    "[": "]", // Label
    "{": "}", // Reserved
    "(": ")", // Argument
    "`": "`", // Code Span
    "$`": "`$" // Formula Span
};

const bracketsBackward: Record<string, string> = Object.fromEntries(
    Object.entries(brackets).map(([k, v]) => [v, k])
);

const exclusiveBrackets = ["`", "$`"];

export function findTokenClosingBracket(
    tokens: TokensNode,
    index: number,
    greedy: boolean = false /* Capture self-closing bracket only */
): FindTokenResult | null {
    const openToken = tokens.tokens[index];
    const closeBracket = brackets[openToken.text] ?? openToken.text;

    const bracketsCounter: Record<string, number> = Object.fromEntries(
        Object.keys(brackets).map(k => [k, 0])
    );

    for (let i = index + 1; i < tokens.tokens.length; ++i) {
        const token = tokens.tokens[i];
        if (isParagraphBreak(token, i, tokens)) {
            return null; // break breaks the brackets
        }

        if (
            token.type !== TokenType.JoinableSpecial &&
            token.type !== TokenType.SeparatedSpecial
        ) {
            continue;
        }

        if (greedy) {
            if (token.text === closeBracket) {
                return {
                    token: token,
                    index: i
                };
            }
        } else {
            if (
                Object.values(bracketsCounter).reduce(
                    (prev, current) => prev + current,
                    0
                ) === 0
            ) {
                if (token.text === closeBracket) {
                    return {
                        token: token,
                        index: i
                    };
                }
            }

            const exclusiveBracket =
                exclusiveBrackets
                    .map(v => [v, bracketsCounter[v]] as const)
                    .find(v => v[1]) ?? null;
            if (exclusiveBracket) {
                const exclusiveOpenBracket = exclusiveBracket[0];
                const exclusiveCloseBracket = brackets[exclusiveOpenBracket];
                if (token.text == exclusiveCloseBracket) {
                    bracketsCounter[exclusiveOpenBracket] -= 1;
                }
            } else {
                // Count all inner brackets
                if (token.text in brackets) {
                    bracketsCounter[token.text] += 1;
                } else if (token.text in bracketsBackward) {
                    bracketsCounter[bracketsBackward[token.text]] -= 1;
                }
            }
        }
    }

    return null;
}

export function isOpenLabelBracket(tokens: TokensNode, index: number): boolean {
    const token = tokens.tokens[index];

    if (
        token.type !== TokenType.JoinableSpecial &&
        token.type !== TokenType.SeparatedSpecial
    ) {
        return false;
    }

    return token.text == "[";
}

export function isOpenArgumentBracket(
    tokens: TokensNode,
    index: number
): boolean {
    const token = tokens.tokens[index];

    if (
        token.type !== TokenType.JoinableSpecial &&
        token.type !== TokenType.SeparatedSpecial
    ) {
        return false;
    }

    return token.text == "(";
}

interface TrimWithPositionsResult {
    result: string;
    leftTrim: number;
    rightTrim: number;
}

export function trimSingleWithPositions(str: string): TrimWithPositionsResult {
    const originalLen = str.length;
    const leftLen = originalLen - str.trimStart().length;
    const rightLen = originalLen - str.trimEnd().length;

    if (originalLen <= leftLen + rightLen) {
        return {
            result: " ",
            leftTrim: originalLen - 1,
            rightTrim: 0
        };
    }

    return {
        result: str.slice(
            leftLen > 0 ? leftLen - 1 : 0,
            rightLen > 0 ? originalLen - rightLen + 1 : originalLen
        ),
        leftTrim: leftLen > 0 ? leftLen - 1 : 0,
        rightTrim: rightLen > 0 ? rightLen - 1 : 0
    };
}

interface ParseTokensNodeResult {
    nodes: Node[];
    diagnostic: DiagnoseList;
}

export function parseTokensNode(tokens: TokensNode): ParseTokensNodeResult {
    const parsingResult: ParseTokensNodeResult = {
        nodes: [],
        diagnostic: []
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
                    DiagnoseSeverity.Fatal
                )
            ) {
                return parsingResult;
            }

            continue;
        }

        parsingResult.nodes.push({
            type: NodeType.Text,
            parent: tokens.parent,
            text: token.text,
            pos: {
                start: token.pos,
                end: token.pos + token.text.length
            },
            children: []
        } as TextNode);
        ++i;
    }

    nodeJoiner(parsingResult.nodes);
    // parsingResult.nodes = parsingResult.nodes.map(n => {
    //     if (n.type === NodeType.Text) {
    //         const trimmed = trimSingleWithPositions((n as TextNode).text);
    //         return {
    //             type: NodeType.Text,
    //             text: trimmed.result,
    //             parent: n.parent,
    //             pos: {
    //                 start: n.pos.start + trimmed.leftTrim,
    //                 end: n.pos.end - trimmed.rightTrim,
    //             },
    //             children: (n as TextNode).children,
    //         } as TextNode;
    //     }
    //     return n;
    // });
    parsingResult.nodes = parsingResult.nodes.filter(
        n => n.type !== RawNodeType.ParagraphBreak
    );
    return parsingResult;
}

function nodeJoiner(nodes: Node[]): void {
    const breaks: (NodeType | RawNodeType)[] = [
        RawNodeType.SoftBreak,
        RawNodeType.ParagraphBreak
    ];
    if (breaks.indexOf(nodes[0]?.type) !== -1) {
        nodes.splice(0, 1);
    }

    // TODO: Trim nodes
    while (nodes.length) {
        const textNode = nodes[0] as TextNode;

        if (
            textNode.type !== NodeType.Text ||
            textNode.text.trim().length !== 0
        ) {
            break;
        }

        nodes.splice(0, 1);
    }
    while (nodes.length) {
        const textNode = nodes[nodes.length - 1] as TextNode;

        if (
            textNode.type !== NodeType.Text ||
            textNode.text.trim().length !== 0
        ) {
            break;
        }

        nodes.splice(nodes.length - 1, 1);
    }

    let index = 1;
    while (index < nodes.length) {
        const currentNode = nodes[index];
        const prevNode = nodes[index - 1];

        if (currentNode.type === RawNodeType.SoftBreak) {
            if (
                prevNode.type === NodeType.Text &&
                nodes[index + 1]?.type === NodeType.Text
            ) {
                const prevNodeText = prevNode as Node & NodeText;

                prevNodeText.pos.end = currentNode.pos.end;
                prevNodeText.text += " ";
            }

            nodes.splice(index, 1);
            continue;
        }

        if (
            currentNode.type === prevNode.type &&
            currentNode.type === NodeType.Text
        ) {
            // Contains 'text' field => is a NodeText
            const currentNodeText = currentNode as Node & NodeText;
            const prevNodeText = prevNode as Node & NodeText;

            prevNodeText.pos.end = currentNodeText.pos.end;
            prevNodeText.text += currentNodeText.text;

            nodes.splice(index, 1);
            continue;
        }

        if (
            currentNode.type === prevNode.type &&
            currentNode.type === NodeType.Blockquote
        ) {
            // Contains 'text' field => is a NodeText
            const currentNodeChildren = currentNode as Node & NodeChildren;
            const prevNodeChildren = prevNode as Node & NodeChildren;

            prevNodeChildren.pos.end = currentNodeChildren.pos.end;
            prevNodeChildren.children.push(...currentNodeChildren.children);
            currentNodeChildren.children.forEach(
                n => (n.parent = prevNodeChildren)
            );

            nodes.splice(index, 1);
            continue;
        }

        ++index;
    }
}

function parseTokensNodeByType(
    tokens: TokensNode,
    index: number
): TokenByTypeParserResult | null {
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
        parseCodeSpan,
        parseStrongWithOptionalEm,
        parseEm,
        parseHeading,
        parseHr,
        parseCode
    ],
    [TokenType.SeparatedSpecial]: [
        parseLink,
        parseMacro,
        parseImage,
        parseTable,
        parseBlockquote
    ],
    [TokenType.Delimiter]: [parseSoftBreak, parseParagraphBreak],
    [TokenType.Spacer]: [parseList],
    [TokenType.Letter]: [parseList],
    [TokenType.Other]: []
};

export function tokenToDiagnose(
    tokens: TokensNode,
    index: number,
    message: string,
    severity: DiagnoseSeverity = DiagnoseSeverity.Fatal
): DiagnoseInfo {
    const token = tokens.tokens[index];
    const nodeParentFile = getNodeParentFile(tokens);
    return {
        message: message,
        severity: severity,
        filePath: nodeParentFile?.path ?? "null",
        errorType: DiagnoseErrorType.ApplyParserError,
        pos: {
            start: {
                absolute: token.pos,
                ...positionToTextPosition(nodeParentFile?.raw ?? "", token.pos)
            },
            end: {
                absolute: token.pos + token.text.length,
                ...positionToTextPosition(
                    nodeParentFile?.raw ?? "",
                    token.pos + token.text.length
                )
            }
        }
    };
}

export function unexpectedEof(
    tokens: TokensNode,
    index: number,
    message: string
): TokenByTypeParserResult {
    return {
        nodes: [],
        index: tokens.tokens.length,
        diagnostic: [
            tokenToDiagnose(tokens, index, message, DiagnoseSeverity.Error)
        ]
    };
}

export function sliceTokenText(
    tokens: TokensNode,
    fromIndex: number,
    toIndex: number
): string {
    const tokenStart = tokens.tokens[fromIndex];
    const tokenEnd: Token | null = tokens.tokens[toIndex];

    return tokens.text.slice(
        tokenStart.pos - tokens.pos.start,
        tokenEnd ? tokenEnd.pos - tokens.pos.end : tokens.pos.end
    );
}
