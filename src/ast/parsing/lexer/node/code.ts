import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import {
    CodeNode,
    copyTextPosition,
    Node,
    NodeType,
    TextNode,
} from '../../../node';
import {
    findTokenOrNull,
    findTokenOrNullBackward,
    sliceTokenText,
    tokenToDiagnose,
    unexpectedEof,
} from '../index';
import { DiagnoseList, DiagnoseSeverity } from '../../../../diagnostic';
import { isPrevTokenDelimiter } from './breaks';
import {
    getMacroArgs,
    getMacroLabel,
    parseMacroKeyArgs,
    parseMacroPosArgs,
} from './macros';
import { ArgInfo, ArgInfoType, parseMacrosArguments } from '../../../../macro';

export const isCode: TokenPredicate = function (token, index, node) {
    if (!isPrevTokenDelimiter(token, index, node)) {
        return false;
    }

    if (token.type !== TokenType.JoinableSpecial) {
        return false;
    }
    if (!token.text.startsWith('```')) {
        return false;
    }

    if (index && node.tokens[index - 1].type !== TokenType.Delimiter) {
        return !(
            node.tokens[index - 1].type !== TokenType.Spacer ||
            node.tokens[index - 2]?.type !== TokenType.Delimiter
        );
    }

    return true;
};

const argInfo: ArgInfo[] = [
    {
        name: 'name',
        aliases: ['n'],
        type: ArgInfoType.NodeArray,
        optional: true,
        onlySpans: true,
    },
    {
        name: 'language',
        aliases: ['lang', 'l'],
        type: ArgInfoType.TextNode,
        optional: true,
        onlySpans: true,
    },
];

export const parseCode: TokenParser = function (tokens, index) {
    const diagnostic: DiagnoseList = [];

    const token = tokens.tokens[index];
    if (!isCode(token, index, tokens)) {
        return null;
    }

    const languageNameStart = index + 1;
    let lineBreakResult = findTokenOrNull(
        tokens,
        languageNameStart,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find line break after code',
            diagnostic,
        );
    }

    let argStartIndex;
    for (
        argStartIndex = languageNameStart;
        argStartIndex < lineBreakResult.index;
        ++argStartIndex
    ) {
        const token = tokens.tokens[argStartIndex];
        if (
            [
                TokenType.Letter,
                TokenType.SeparatedSpecial,
                TokenType.JoinableSpecial,
            ].indexOf(token.type) === -1 ||
            ['[', '('].indexOf(token.text) !== -1
        ) {
            break;
        }
    }

    const languageNameEnd = argStartIndex;
    const languageNameEndToken = tokens.tokens[languageNameEnd - 1];
    const languageNameNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        pos: {
            start: tokens.tokens[languageNameStart].pos,
            end: languageNameEndToken.pos + languageNameEndToken.text.length,
        },
        text: sliceTokenText(tokens, languageNameStart, languageNameEnd),
    };

    const labelResult = getMacroLabel(tokens, argStartIndex);
    diagnostic.push(...labelResult.diagnostic);

    const label = labelResult.label ?? undefined;

    const macroArgsResult = getMacroArgs(tokens, labelResult.index);
    diagnostic.push(...macroArgsResult.diagnostic);

    lineBreakResult = findTokenOrNull(
        tokens,
        macroArgsResult.index,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find line break after code',
            diagnostic,
        );
    }

    // TODO: encapsulate pos and key args parsing
    const parsePosArgsResult = parseMacroPosArgs(macroArgsResult.posArgs);
    diagnostic.push(...parsePosArgsResult.diagnostic);

    const parseKeyArgsResult = parseMacroKeyArgs(macroArgsResult.keyArgs);
    diagnostic.push(...parseKeyArgsResult.diagnostic);

    const endArgToken = tokens.tokens[macroArgsResult.index - 1];
    const argParsingResult = parseMacrosArguments(
        {
            // Ephimeral node
            type: NodeType.OpCode,
            pos: {
                start: token.pos,
                end: endArgToken.pos + endArgToken.text.length,
            },
            posArgs: parsePosArgsResult.result,
            keys: macroArgsResult.keys,
            keyArgs: parseKeyArgsResult.result,
            parent: tokens.parent,
        },
        argInfo,
    );
    diagnostic.push(...argParsingResult.diagnostic);

    const argsResult = argParsingResult.result as {
        name?: Node[];
        language?: TextNode;
    };

    if (languageNameNode.text && argsResult.language) {
        diagnostic.push(
            tokenToDiagnose(
                tokens,
                languageNameStart,
                'Multiple "lang" definition',
                DiagnoseSeverity.Error,
            ),
        );
    }
    if (argsResult.language) {
        languageNameNode.text = argsResult.language.text;
        languageNameNode.pos = {
            ...argsResult.language.pos,
        };
    }

    const endTokenResult = findTokenOrNull(
        tokens,
        lineBreakResult.index + 1,
        isCode,
    );
    if (!endTokenResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find closing quotes for block code',
            diagnostic,
        );
    }

    const lineBreakEndResult = findTokenOrNullBackward(
        tokens,
        endTokenResult.index - 1,
        t => t.type === TokenType.Delimiter,
    );
    if (!lineBreakEndResult) {
        return unexpectedEof(
            tokens,
            index,
            'Unable to find end closing quotes for block code ' +
                '(internal error)',
            diagnostic,
        );
    }

    const codeTextNode: TextNode = {
        type: NodeType.Text,
        parent: tokens.parent,
        pos: {
            start: tokens.tokens[lineBreakResult.index + 1].pos,
            end:
                lineBreakEndResult.token.pos +
                lineBreakEndResult.token.text.length,
        },
        text: tokens.tokens
            .slice(lineBreakResult.index + 1, lineBreakEndResult.index)
            .map(v => v.text)
            .join(''),
    };

    const endToken = endTokenResult.token;
    const codeNode: CodeNode = {
        type: NodeType.Code,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        code: codeTextNode,
        parent: tokens.parent,
        lang: languageNameNode.text ? languageNameNode : undefined,
        label: label,
        name: argsResult.name,
    };
    if (label) {
        label.parent = codeNode;
    }

    languageNameNode.parent = codeNode;
    codeTextNode.parent = codeNode;

    Object.values(macroArgsResult.keys).forEach(v => (v.parent = codeNode));
    parsePosArgsResult.result.forEach(v =>
        v.forEach(v => (v.parent = codeNode)),
    );
    Object.values(parseKeyArgsResult.result).forEach(v =>
        v.forEach(v => (v.parent = codeNode)),
    );

    return {
        nodes: [codeNode],
        index: endTokenResult.index + 1,
        diagnostic: diagnostic,
    };
};
