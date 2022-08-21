import { Token, TokenType } from '../tokenizer';
import {
    getNodeParentFile,
    Node,
    NodeChildren,
    NodeText,
    NodeType,
    ParagraphNode,
    positionToTextPosition,
    RawNodeType,
    TEXT_LIKE_NODES,
    TextNode,
    TokensNode,
} from '../../node';
import { TokenByTypeParserResult, TokenParser, TokenPredicate } from './struct';
import {
    isParagraphBreak,
    parseParagraphBreak,
    parseSoftBreak,
    parseTextBreak,
} from './node/breaks';
import {
    DiagnoseErrorType,
    DiagnoseInfo,
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
} from '../../../diagnostic';
import { parseCodeSpan } from './node/codeSpan';
import { parseStrongWithOptionalEm } from './node/strong';
import { parseDel } from './node/del';
import { parseNonBreakingSpace, parseThinNonBreakingSpace } from './node/space';
import { parseEm } from './node/em';
import { parseUnderline } from './node/underline';
import { parseHeading } from './node/heading';
import { parseHr } from './node/hr';
import { parseList } from './node/list';
import { parseCode } from './node/code';
import { parseFormulaSpan } from './node/formulaSpan';
import { parseFormulaOrLatex } from './node/formulaOrLatex';
import { parseLatexSpan } from './node/latexSpan';
import { parseComment } from './node/comment';
import { parseLink } from './node/link';
import { parseMacro } from './node/macros';
import { parseImage } from './node/image';
import { parseTable } from './node/table';
import { parseBlockquote } from './node/blockquote';
import { parseLinkSimple } from './node/linkSimple';

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

const brackets: Record<string, string> = {
    '[': ']', // Label
    '{': '}', // Reserved
    '(': ')', // Argument
    '`': '`', // Code Span
    '<': '>', // Link Simple
    '<<<': '>>>', // Guillemet
    '$`': '`$', // Formula Span
};

const bracketsBackward: Record<string, string> = Object.fromEntries(
    Object.entries(brackets).map(([k, v]) => [v, k]),
);

const exclusiveBrackets = ['`', '$`'];

export function findTokenClosingBracket(
    tokens: TokensNode,
    index: number,
    greedy: boolean = false /* Capture self-closing bracket only */,
): FindTokenResult | null {
    const openToken = tokens.tokens[index];
    const closeBracket = brackets[openToken.text] ?? openToken.text;

    const bracketsCounter: Record<string, number> = Object.fromEntries(
        Object.keys(brackets).map(k => [k, 0]),
    );

    for (let i = index + 1; i < tokens.tokens.length; ++i) {
        const token = tokens.tokens[i];
        if (isParagraphBreak(token, i, tokens)) {
            return null; // linebreak breaks the brackets
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
                    index: i,
                };
            }
        } else {
            if (
                Object.values(bracketsCounter).reduce(
                    (prev, current) => prev + current,
                    0,
                ) === 0
            ) {
                if (token.text === closeBracket) {
                    return {
                        token: token,
                        index: i,
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

    return token.text == '[';
}

export function isOpenArgumentBracket(
    tokens: TokensNode,
    index: number,
): boolean {
    const token = tokens.tokens[index];

    if (
        token.type !== TokenType.JoinableSpecial &&
        token.type !== TokenType.SeparatedSpecial
    ) {
        return false;
    }

    return token.text == '(';
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

    for (let i = 0; i < tokens.tokens.length /*manual*/; ) {
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

        parsingResult.nodes.push({
            type: NodeType.Text,
            parent: tokens.parent,
            text: token.text,
            pos: {
                start: token.pos,
                end: token.pos + token.text.length,
            },
            children: [],
        } as TextNode);
        ++i;
    }

    nodeJoiner(parsingResult.nodes);

    if (tokens.parent && tokens.parent.type === NodeType.File) {
        parsingResult.nodes = applyParagraphs(parsingResult.nodes);
    }
    parsingResult.nodes = parsingResult.nodes.filter(
        n => n.type !== RawNodeType.ParagraphBreak,
    );

    return parsingResult;
}

function nodeJoiner(nodes: Node[]): void {
    const breaks: (NodeType | RawNodeType)[] = [
        RawNodeType.SoftBreak,
        RawNodeType.ParagraphBreak,
    ];
    if (breaks.indexOf(nodes[0]?.type) !== -1) {
        nodes.splice(0, 1);
    }

    // Trim start and end
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
                (<(NodeType | RawNodeType)[]>[
                    NodeType.FormulaSpan,
                    NodeType.CodeSpan,
                    NodeType.LatexSpan,
                    NodeType.Link,
                    NodeType.Strong,
                    NodeType.Em,
                    NodeType.Del,
                    NodeType.Text,
                ]).indexOf(prevNode.type) !== -1 &&
                nodes[index + 1]?.type === NodeType.Text
            ) {
                const nextNodeText = nodes[index + 1] as Node & NodeText;

                nextNodeText.pos.end = currentNode.pos.end;
                nextNodeText.text = ' ' + nextNodeText.text;
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
                n => (n.parent = prevNodeChildren),
            );

            nodes.splice(index, 1);
            continue;
        }

        ++index;
    }
}

function applyParagraphs(roNodes: Readonly<Node[]>): Node[] {
    const nodes: Node[] = [...roNodes];

    let lastTextNodeIndex: number | null = null;
    let i = 0;
    while (i < nodes.length) {
        const node = nodes[i];
        if (TEXT_LIKE_NODES.indexOf(node.type) === -1) {
            if (lastTextNodeIndex !== null) {
                const paragraphChildren = nodes.splice(
                    lastTextNodeIndex,
                    i - lastTextNodeIndex,
                );

                const paragraphNode: ParagraphNode = {
                    type: NodeType.Paragraph,
                    parent: node.parent,
                    pos: {
                        start: paragraphChildren[0].pos.start,
                        end: paragraphChildren[paragraphChildren.length - 1].pos
                            .end,
                    },
                    children: paragraphChildren,
                };
                paragraphChildren.forEach(n => (n.parent = paragraphNode));
                nodes.splice(lastTextNodeIndex, 0, paragraphNode);

                i = lastTextNodeIndex + 1;
                lastTextNodeIndex = null;
                continue;
            }

            ++i;
            continue;
        }

        if (lastTextNodeIndex === null) {
            lastTextNodeIndex = i;
        }
        ++i;
    }

    if (lastTextNodeIndex !== null) {
        const paragraphChildren = nodes.splice(
            lastTextNodeIndex,
            nodes.length - lastTextNodeIndex,
        );

        const paragraphNode: ParagraphNode = {
            type: NodeType.Paragraph,
            parent: paragraphChildren[0].parent,
            pos: {
                start: paragraphChildren[0].pos.start,
                end: paragraphChildren[paragraphChildren.length - 1].pos.end,
            },
            children: paragraphChildren,
        };
        paragraphChildren.forEach(n => (n.parent = paragraphNode));
        nodes.splice(lastTextNodeIndex, 0, paragraphNode);
    }

    return nodes;
}

function parseTokensNodeByType(
    tokens: TokensNode,
    index: number,
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
        parseDel,
        parseNonBreakingSpace,
        parseThinNonBreakingSpace,
        parseEm,
        parseUnderline,
        parseHeading,
        parseBlockquote,
        parseHr,
        parseLinkSimple,
        parseList,
        parseCode,
        parseFormulaSpan,
        parseFormulaOrLatex,
        parseLatexSpan,
        parseComment,
    ],
    [TokenType.SeparatedSpecial]: [
        parseLink,
        parseMacro,
        parseImage,
        parseTable,
        parseList,
    ],
    [TokenType.Delimiter]: [parseSoftBreak, parseParagraphBreak],
    [TokenType.Spacer]: [parseList, parseTextBreak],
    [TokenType.Letter]: [parseList],
};

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

export function unexpectedEof(
    tokens: TokensNode,
    index: number,
    message: string,
    diagnostic?: DiagnoseList,
): TokenByTypeParserResult {
    return {
        nodes: [],
        index: tokens.tokens.length,
        diagnostic: [
            ...(diagnostic ?? []),
            tokenToDiagnose(tokens, index, message, DiagnoseSeverity.Error),
        ],
    };
}

export function sliceTokenText(
    tokens: TokensNode,
    fromIndex: number,
    toIndex: number,
): string {
    const tokenStart = tokens.tokens[fromIndex];
    const tokenEnd: Token | null = tokens.tokens[toIndex];

    return tokens.text.slice(
        tokenStart.pos - tokens.pos.start,
        tokenEnd ? tokenEnd.pos - tokens.pos.end : tokens.pos.end,
    );
}
