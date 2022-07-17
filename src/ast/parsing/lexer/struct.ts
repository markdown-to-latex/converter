import { Token } from '../tokenizer';
import { Node, TokensNode } from '../../node';
import { DiagnoseList } from '../../../diagnose';

export type TokenPredicate = (
    token: Token,
    index: number,
    node: TokensNode,
) => boolean;

export interface TokenByTypeParserResult {
    nodes: Node[];
    index: number;
    diagnostic: DiagnoseList;
}

export type TokenParser = (
    tokens: TokensNode,
    index: number,
) => TokenByTypeParserResult | null;
