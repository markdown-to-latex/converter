import { getLatexApplicationLetter } from './latex';

export type WriteFileFunction = (
    content: string,
    fileName: string,
    context: Context,
) => void;

export interface Context {
    config: {
        defaultFontSize: 14;
    };
    applications: {
        accessKeys: string[];
        keyToData: Record<
            string,
            {
                title: string;
                text: (label: string) => string;
            }
        >;
    };
    references: {
        accessKeys: string[];
        keyToData: Record<
            string,
            {
                text: (label: string) => string;
            }
        >;
    };
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
        key: string;
        label: string;
        lang: string;
    };
    writeFile: WriteFileFunction;
}

export function getOrCreatePictureLabel(context: Context, key: string): string {
    let label = context.picture.keyToLabel[key];
    if (label !== undefined) {
        return label;
    }

    const lastLabel = Math.max(
        0,
        ...Object.values(context.picture.keyToLabel).map(v => +v),
    );
    label = (lastLabel + 1).toString();
    context.picture.keyToLabel[key] = label;
    return label;
}

export function getOrCreateTableLabel(context: Context, key: string): string {
    let label = context.table.keyToLabel[key];
    if (label !== undefined) {
        return label;
    }

    const lastLabel = Math.max(
        0,
        ...Object.values(context.table.keyToLabel).map(v => +v),
    );
    label = (lastLabel + 1).toString();
    context.table.keyToLabel[key] = label;
    return label;
}

class ContextError extends Error {}

export function getApplicationLabelByKey(
    context: Context,
    key: string,
): string {
    if (context.applications.keyToData[key] === undefined) {
        throw new ContextError(`Application with key "${key}" not found`);
    }

    let index = context.applications.accessKeys.indexOf(key);
    if (index === -1) {
        index = context.applications.accessKeys.length;
        context.applications.accessKeys.push(key);
    }

    return getLatexApplicationLetter(index);
}

export function addApplicationByKey(
    context: Context,
    key: string,
    data: Context['applications']['keyToData'][0],
): void {
    if (context.applications.keyToData[key] !== undefined) {
        throw new ContextError(`Application with key "${key}" already exists`);
    }

    context.applications.keyToData[key] = data;
}

export function getReferenceLabelByKey(context: Context, key: string): string {
    if (context.references.keyToData[key] === undefined) {
        throw new ContextError(`Reference with key "${key}" not found`);
    }

    let index = context.references.accessKeys.indexOf(key);
    if (index === -1) {
        index = context.references.accessKeys.length;
        context.references.accessKeys.push(key);
    }

    return index.toString();
}

export function addReferenceByKey(
    context: Context,
    key: string,
    data: Context['references']['keyToData'][0],
): void {
    if (context.references.keyToData[key] !== undefined) {
        throw new ContextError(`Reference with key "${key}" already exists`);
    }

    context.references.keyToData[key] = data;
}
