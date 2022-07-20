import table from './processing/table';
import code from './processing/code';
import { NodeProcessed, ProcessingInfo } from './struct';
import {
    Node,
    NodeEParentData,
} from '../../ast/node';
import { ContextE } from '../../context';
import picture from './processing/picture';

const ALL_PROCESSING: ProcessingInfo<Node>[] = [
    picture as ProcessingInfo<Node>,
    table as ProcessingInfo<Node>,
    code as ProcessingInfo<Node>,
];

export function processNode(
    ctx: ContextE,
    data: NodeEParentData,
): NodeProcessed[] | null {
    const node = data.node.n;
    const processing = ALL_PROCESSING.find(d => d.type === node.type);

    return !processing
        ? null
        : processing.callback(ctx, {
              node: data.node,
              index: data.index,
              container: data.container,
          });
}
