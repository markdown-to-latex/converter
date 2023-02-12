import {
    CodeProcessedNode,
    FormulaNoLabelProcessedNode,
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
} from '../struct';
import {FormulaNode, NodeType} from '../../../ast/node';

const callback: ProcessingInfoCallback<FormulaNode> = function (ctx, data) {
    const formulaNode = data.node.n;

    if (!(formulaNode.label)) {
        return [{
            ...formulaNode,

            type: ProcessedNodeType.FormulaNoLabelProcessed,
            pos: {...formulaNode.pos},
        } as FormulaNoLabelProcessedNode];
    }
    const index = ctx.createFormulaLabelData({
        label: formulaNode.label
    });

    return [
        {
            ...formulaNode,

            type: ProcessedNodeType.FormulaProcessed,
            pos: {...formulaNode.pos},
            label: formulaNode.label,
            index,
        },
    ];
};

export default {
    type: NodeType.Formula,
    callback: callback,
} as ProcessingInfo<FormulaNode>;
