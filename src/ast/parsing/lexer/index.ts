import { Node, RawNode, RawNodeType, TokensNode } from '../../node';
import {
    DiagnoseList,
    diagnoseListHasSeverity,
    DiagnoseSeverity,
} from '../../../diagnostic';
import { tokenize, tokensToNode } from '../tokenizer';
import { parseTokensNode } from './function';

class FatalError extends Error {}

interface ApplyVisitorsResult {
    nodes: Node[];
    diagnostic: DiagnoseList;
}

export function applyVisitors(nodes: Readonly<Node[]>): ApplyVisitorsResult {
    const visitorsResult: ApplyVisitorsResult = {
        nodes: [...nodes],
        diagnostic: [],
    };

    try {
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
                    DiagnoseSeverity.Fatal,
                )
            ) {
                throw new FatalError();
            }

            return result.nodes;
        });
    } catch (e) {
        if (e instanceof FatalError) {
            return visitorsResult;
        } else {
            throw e;
        }
    }

    return visitorsResult;
}

// --- api

export * from './struct';
export * from './function';
export * as node from './node';
