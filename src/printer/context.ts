import { Node } from '../ast/nodes';

export interface Context {
    applications: Record<string, Node>;
    references: Record<string, Node>;
    picture: {
        key: string;
        label: string;
        height: string;
        keyToLabel: Record<string, string>;
    };
    table: {
        key: string;
        label: string;
        keyToLabel: Record<string, string>;
    };
    code: {
        lang: string;
    };
}

export function getOrCreatePictureLabel(context: Context, key: string): string {
    let label = context.picture.keyToLabel[key]
    if (label !== undefined) {
        return label;
    }

    const lastLabel = Math.max(...Object.values(context.picture.keyToLabel).map(v => +v))
    label =  (lastLabel + 1).toString()
    context.picture.keyToLabel[key] = label
    return label
}

export function getOrCreateTableLabel(context: Context, key: string): string {
    let label = context.table.keyToLabel[key]
    if (label !== undefined) {
        return label;
    }

    const lastLabel = Math.max(...Object.values(context.table.keyToLabel).map(v => +v))
    label =  (lastLabel + 1).toString()
    context.table.keyToLabel[key] = label
    return label
}