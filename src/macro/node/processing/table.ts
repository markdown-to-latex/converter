import {
    ProcessedNodeType,
    ProcessingInfo,
    ProcessingInfoCallback,
    TableProcessedNode,
} from '../struct';
import { NodeType, TableNode } from '../../../ast/node';
import { fallbackNameNodes } from '../utils';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../../diagnose';

function fallbackTableNode(tableNode: TableNode): TableProcessedNode {
    return {
        ...tableNode,

        type: ProcessedNodeType.TableProcessed,
        name: fallbackNameNodes(tableNode),
        label: 'unknown-table-1',
        index: -1,
    };
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
