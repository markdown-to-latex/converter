import { TokenParser, TokenPredicate } from '../struct';
import { TokenType } from '../../tokenizer';
import { CodeNode, Node, NodeType } from '../../../node';
import {
    findTokenOrNull,
    findTokenOrNullBackward,
    tokenToDiagnose,
    unexpectedEof,
} from '../index';
import { DiagnoseList, DiagnoseSeverity } from '../../../../diagnose';
import { isPrevTokenDelimiter } from './breaks';
import {
    getMacroArgs,
    getMacroLabel,
    parseMacroKeyArgs,
    parseMacroPosArgs,
} from './macros';
import {
    ArgInfo,
    ArgInfoType,
    parseMacrosArguments,
} from '../../../../macro/args';

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
        type: ArgInfoType.Text,
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

    let lineBreakResult = findTokenOrNull(
        tokens,
        index + 1,
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

    let languageName: string | undefined = undefined;
    let argStartIndex;
    for (
        argStartIndex = index + 1;
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

        languageName ??= '';
        languageName += token.text;
    }

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
        language?: string;
    };

    if (languageName && argsResult.language) {
        diagnostic.push(
            tokenToDiagnose(
                tokens,
                index + 1,
                'Multiple "lang" definition',
                DiagnoseSeverity.Error,
            ),
        );
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

    const endToken = endTokenResult.token;
    const codeNode: CodeNode = {
        type: NodeType.Code,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        text: tokens.tokens
            .slice(lineBreakResult.index + 1, lineBreakEndResult.index)
            .map(v => v.text)
            .join(''),
        parent: tokens.parent,
        lang: languageName ?? argsResult.language,
        label: label,
        name: argsResult.name,
    };
    if (label) {
        label.parent = codeNode;
    }

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
