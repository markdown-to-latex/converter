import {
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
    TableProcessedNode,
} from '../struct';
import { NodeType, TableNode, TextNode } from '../../../ast/node';
import { fallbackNameNodes } from '../utils';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../diagnose';

function fallbackTableNode(tableNode: TableNode): TableProcessedNode {
    const labelNode: TextNode = {
        type: NodeType.Text,
        parent: null,
        pos: {
            start: tableNode.pos.start,
            end: tableNode.pos.start,
        },
        text: 'unknown-table-1',
    };

    const fallbackTableNode: TableProcessedNode = {
        ...tableNode,

        type: ProcessedNodeType.TableProcessed,
        name: fallbackNameNodes(tableNode),
        label: labelNode,
        index: -1,
    };
    labelNode.parent = fallbackTableNode;

    return fallbackTableNode;
}

const callback: ProcessingInfoCallback<TableNode> = function (ctx, data) {
    const tableNode = data.node.n;

    const currentTableInfo = ctx.c.temp.table;
    if (!currentTableInfo) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                tableNode,
                DiagnoseSeverity.Error,
                DiagnoseErrorType.MacrosError,
                'Table must be followed by !T[] macros',
            ),
        );
        return [fallbackTableNode(tableNode)];
    }

    const index = ctx.createTableLabelData({
        ...currentTableInfo,
    });

    const tableProcessedNode: TableProcessedNode = {
        ...tableNode,

        type: ProcessedNodeType.TableProcessed,
        name: [...currentTableInfo.name],
        label: currentTableInfo.label,
        index,
    };
    ctx.c.temp.table = null;

    return [tableProcessedNode];
};

export default {
    type: NodeType.Table,
    callback: callback,
} as ProcessingInfo<TableNode>;
