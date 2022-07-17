import {TokenParser, TokenPredicate} from '../struct';
import {Token, TokenType} from '../../tokenizer';
import {ImageNode, Node, NodeType, TextNode} from '../../../node';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodesToDiagnose,
} from '../../../../diagnose';
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
} from '../../../../macros/args';

export const isImage: TokenPredicate = function (token, index, node) {
    if (!(token.type === TokenType.SeparatedSpecial && token.text === '!')) {
        return false;
    }

    const bracketToken: Token | null = node.tokens[index + 1] ?? null;
    return (
        bracketToken?.type === TokenType.SeparatedSpecial &&
        bracketToken?.text === '['
    );
};

const argInfo: ArgInfo[] = [
    {
        name: 'name',
        type: ArgInfoType.NodeArray,
        optional: true,
        aliases: ['n'],
    },
    {
        name: 'width',
        type: ArgInfoType.Text,
        optional: true,
        aliases: ['w'],
    },
    {
        name: 'height',
        type: ArgInfoType.Text,
        optional: true,
        aliases: ['h'],
    },
];

export const parseImage: TokenParser = function (tokens, index) {
    const token = tokens.tokens[index];
    if (!isImage(token, index, tokens)) {
        return null;
    }

    const diagnostic: DiagnoseList = [];
    const labelResult = getMacroLabel(tokens, index + 1);

    const label = labelResult.label;
    if (!label) {
        return null; // TODO: diagnostic error
    }

    diagnostic.push(...labelResult.diagnostic);

    const macroArgsResult = getMacroArgs(tokens, labelResult.index);
    diagnostic.push(...macroArgsResult.diagnostic);

    if (macroArgsResult.posArgs.length === 0) {
        return null; // TODO: diagnostic error
    }
    const imageUrl = macroArgsResult.posArgs.splice(0, 1)[0];

    const parsePosArgsResult = parseMacroPosArgs(macroArgsResult.posArgs);
    diagnostic.push(...parsePosArgsResult.diagnostic);

    const parseKeyArgsResult = parseMacroKeyArgs(macroArgsResult.keyArgs);
    diagnostic.push(...parseKeyArgsResult.diagnostic);

    const endToken = tokens.tokens[macroArgsResult.index - 1];
    const argParsingResult = parseMacrosArguments(
        {
            // Ephimeral node
            type: NodeType.OpCode,
            pos: {
                start: token.pos,
                end: endToken.pos + endToken.text.length,
            },
            posArgs: parsePosArgsResult.result,
            keyArgs: parseKeyArgsResult.result,
            parent: tokens.parent,
        },
        argInfo,
    );
    diagnostic.push(...argParsingResult.diagnostic);
    const argsResult = argParsingResult.result as {
        name?: Node[];
        width?: string;
        height?: string;
    };

    const imageNode: ImageNode = {
        type: NodeType.Image,
        pos: {
            start: token.pos,
            end: endToken.pos + endToken.text.length,
        },
        parent: tokens.parent,
        text: label,
        href: imageUrl.text,
        ...argsResult,
    };

    argsResult.name?.forEach(v => (v.parent = imageNode));

    return {
        nodes: [imageNode],
        index: macroArgsResult.index,
        diagnostic: diagnostic,
    };
};
