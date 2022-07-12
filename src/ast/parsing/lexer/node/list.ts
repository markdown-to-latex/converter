import {TokenParser} from "../struct";
import {Token, TokenType} from "../../tokenizer";
import {ListItemNode, ListNode, NodeType, RawNodeType, TokensNode} from "../../../node";
import {applyVisitors, findTokenOrNull, sliceTokenText} from "../index";
import {DiagnoseList} from "../../../../diagnose";

export interface IsListItemResult {
    result: boolean;
    indent: number;
}

const UNORDERED_LIST_DOTS = ['*', '-', '+'];
const ORDERED_LIST_DOTS = ['.', ')'];

export function isOrderedListItem(token: Token, index: number, node: TokensNode): IsListItemResult {
    let indent: number = 0;
    if (token?.type === TokenType.Spacer) {
        indent = token.text.length
        index += 1
        token = node.tokens[index];
    }

    if (token?.type !== TokenType.Letter) {
        return {
            result: false,
            indent: 0,
        };
    }

    token = node.tokens[index + 1];
    return {
        result: token?.type === TokenType.SeparatedSpecial && ORDERED_LIST_DOTS.indexOf(token?.text) !== -1,
        indent: indent,
    };
}


export function isUnorderedListItem(token: Token, index: number, node: TokensNode): IsListItemResult {
    let indent: number = 0;
    if (token?.type === TokenType.Spacer) {
        indent = token.text.length
        index += 1
        token = node.tokens[index];
    }

    return {
        result: UNORDERED_LIST_DOTS.indexOf(token?.text) !== -1,
        indent: indent,
    };
}

interface ParseListItemResult {
    item: ListItemNode | null;
    index: number;
    diagnostic: DiagnoseList;

    itemText: string;
    ordered: boolean;
}

function parseListItem(tokens: TokensNode, index: number): ParseListItemResult | null {
    const beginIndex = index;
    const diagnostic: DiagnoseList = []
    let token = tokens.tokens[index];

    let spacers: number = 0;
    if (token.type === TokenType.Spacer) {
        spacers = token.text.length;

        index += 1
        token = tokens.tokens[index];
    }

    let initValue: string = ''
    let ordered: boolean;

    if (token?.type !== TokenType.Letter) {
        if (UNORDERED_LIST_DOTS.indexOf(token?.text) === -1) {
            return null;
        }

        ordered = false;
    } else {
        initValue = token.text;
        ordered = true;

        const listSeparator: Token | null = tokens.tokens[index + 1];
        if (listSeparator?.type !== TokenType.SeparatedSpecial || ORDERED_LIST_DOTS.indexOf(listSeparator?.text) === -1) {
            return null;
        }
    }

    const sliceStart = index + 2;

    // Start parsing from the next line

    const delimiter = findTokenOrNull(tokens, sliceStart, n => n.type === TokenType.Delimiter);
    let lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length

    while (lineDelimiterIndex < tokens.tokens.length) {
        const prevIndex = lineDelimiterIndex + 1;

        const startToken = tokens.tokens[prevIndex];
        if (startToken?.type === TokenType.Delimiter) {
            break;  // Found \n\n
        }

        const asOrderedListItem = isOrderedListItem(startToken, prevIndex, tokens);
        const asUnorderedListItem = isUnorderedListItem(startToken, prevIndex, tokens);
        if ((asOrderedListItem.result && asOrderedListItem.indent <= spacers) || (asUnorderedListItem.result && asUnorderedListItem.indent <= spacers)) {
            break; // Found same or parent list item
        }

        const delimiter = findTokenOrNull(tokens, lineDelimiterIndex + 1, n => n.type === TokenType.Delimiter);
        lineDelimiterIndex = delimiter?.index ?? tokens.tokens.length;
    }

    const sliceEnd = lineDelimiterIndex;
    const endToken = tokens.tokens[sliceEnd - 1]

    const listItemNode: ListItemNode = {
        type: NodeType.ListItem,
        parent: null,
        children: [],
        pos: {
            start: tokens.tokens[beginIndex].pos,
            end: endToken.pos + endToken.text.length
        },
        loose: false,
        task: false,
    }

    const tokensNode: TokensNode = {
        type: RawNodeType.Tokens,
        tokens: tokens.tokens.slice(sliceStart, sliceEnd),
        pos: {
            start: tokens.tokens[sliceStart].pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: listItemNode,
        text: sliceTokenText(tokens, sliceStart, sliceEnd),
    }
    const visitorsResult = applyVisitors([tokensNode]);
    diagnostic.push(...visitorsResult.diagnostic)

    listItemNode.children = visitorsResult.nodes

    return {
        item: listItemNode,
        index: sliceEnd + 1,
        diagnostic: diagnostic,
        itemText: initValue,
        ordered: ordered,
    };
}

export const parseList: TokenParser = function (tokens, index) {
    if (index !== 0 && tokens.tokens[index-1].type !== TokenType.Delimiter) {
        return null;
    }

    const diagnostic: DiagnoseList = [];
    const listItems: ListItemNode[] = [];

    let ordered: boolean | null = null;
    let initText: string | null = null;

    let nextIndex = index;
    let result = parseListItem(tokens, nextIndex);
    while (result) {
        diagnostic.push(...result.diagnostic);
        nextIndex = result.index;
        if (!result.item) {
            break;
        }
        listItems.push(result.item)

        ordered ??= result.ordered;
        initText ??= result.itemText;

        if (result.index >= tokens.tokens.length) {
            break;
        }
        result = parseListItem(tokens, nextIndex)
    }

    if (listItems.length === 0) {
        return null;
    }

    const listNode: ListNode = {
        type: NodeType.List,
        parent: tokens.parent,
        pos: {
            start: listItems[0].pos.start,
            end: listItems[listItems.length - 1].pos.end,
        },
        children: listItems,
        loose: false,       /* TODO: no? */
        start: +(initText ?? '1'),
        ordered: ordered ?? false,
    }
    listItems.forEach(n => n.parent = listNode);

    return {
        nodes: [listNode],
        diagnostic: diagnostic,
        index: nextIndex,
    };
}