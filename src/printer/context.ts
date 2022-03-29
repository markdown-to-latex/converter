import { getLatexApplicationLetter } from './latex';
import {LatexEscapeData, LatexInfo, MarkDownToLaTeXConverter} from "./types";

export type WriteFileFunction = (
    content: string,
    fileName: string,
    context: Context,
) => void;

export interface ContextKeyToLabelValue {
    initialized: boolean;
    label: string;
}

export type RequiredProperty<T> = {
    [P in keyof T]-?: RequiredProperty<NonNullable<T[P]>>;
};

export type ContextConfig = RequiredProperty<Omit<MarkDownToLaTeXConverter, 'files'>>;
export type LatexInfoStrict = RequiredProperty<LatexInfo>;
export type LatexEscapeDataStrict = RequiredProperty<LatexEscapeData>;

export interface Context {
    config: ContextConfig;
    applications: {
        current: {
            title: string;
            key: string;
        } | null;
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
        current: {
            key: string;
        } | null;
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
        keyToLabel: Record<string, ContextKeyToLabelValue>;
    };
    table: {
        key: string;
        label: string;
        keyToLabel: Record<string, ContextKeyToLabelValue>;
    };
    code: {
        key: string;
        label: string;
        lang: string;
        cols: number;
    };
    writeFile: WriteFileFunction;
}

export function getOrCreatePictureLabel(context: Context, key: string): string {
    let label: ContextKeyToLabelValue | undefined =
        context.picture.keyToLabel[key];
    if (label === undefined) {
        return createPictureLabel(context, key, false);
    }

    return label.label;
}

export function createPictureLabel(
    context: Context,
    key: string,
    initialized: boolean = true,
): string {
    let labelValue: ContextKeyToLabelValue | undefined =
        context.picture.keyToLabel[key];
    if (labelValue !== undefined) {
        if (labelValue.initialized) {
            throw new ContextError(`Picture with key '${key}' already exists`);
        } else {
            labelValue.initialized = initialized;
            return labelValue.label;
        }
    }

    const lastLabel = Math.max(
        0,
        ...Object.values(context.picture.keyToLabel).map(v => +v.label),
    );
    const label = (lastLabel + 1).toString();
    context.picture.keyToLabel[key] = {
        label,
        initialized,
    };
    return label;
}

export function getOrCreateTableLabel(context: Context, key: string): string {
    let label: ContextKeyToLabelValue | undefined =
        context.table.keyToLabel[key];
    if (label === undefined) {
        return createTableLabel(context, key, false);
    }

    return label.label;
}

export function createTableLabel(
    context: Context,
    key: string,
    initialized: boolean = true,
): string {
    let labelValue: ContextKeyToLabelValue | undefined =
        context.table.keyToLabel[key];
    if (labelValue !== undefined) {
        if (labelValue.initialized) {
            throw new ContextError(`Table with key '${key}' already exists`);
        } else {
            labelValue.initialized = initialized;
            return labelValue.label;
        }
    }

    const lastLabel = Math.max(
        0,

        // TODO: source of bugs. Rewrite
        ...Object.values(context.table.keyToLabel).map(v => +v.label),
    );

    const label = (lastLabel + 1).toString();
    context.table.keyToLabel[key] = {
        label,
        initialized,
    };
    return label;
}

export class ContextError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, ContextError.prototype);
    }
}

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

    return (index + 1).toString();
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
