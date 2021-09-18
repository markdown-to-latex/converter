import {
    addApplicationByKey,
    addReferenceByKey,
    Context,
    getApplicationLabelByKey,
    getOrCreatePictureLabel,
    getReferenceLabelByKey,
} from './context';
import { OpCodeNode } from '../ast/nodes';

export function resolveOpCode(node: OpCodeNode, context: Context): string {
    const lazy = opCodeMap[node.opcode as OpCodeType];
    if (lazy === undefined) {
        throw new OpCodeError(`Unknown OpCode "${node.opcode}"`);
    }

    return lazy(node.arguments, context);
}

export const enum OpCodeType {
    Picture = 'P',
    PictureKey = 'PK',
    Table = 'T',
    TableKey = 'TK',
    Code = 'C',
    MinusSingle = 'MS',
    ApplicationRaw = 'AR',
    ApplicationPicture = 'AP',
    ApplicationPictureRotated = 'APR',
    ApplicationCode = 'AC',
    ApplicationKey = 'AK',
    ReferenceRaw = 'RR',
    ReferenceKey = 'RK',
    ListAllApplications = 'LAA',
    ListAllReferences = 'LAR',
}

class OpCodeError extends Error {}

function shouldHaveLength(
    type: OpCodeType,
    args: string[],
    length: number,
): void {
    if (args.length !== length) {
        throw new OpCodeError(
            `OpCode "${type}" should have exactly ${length} arguments`,
        );
    }
}

function compareKeyArrayAndMap(
    keys: readonly string[],
    data: Readonly<Record<string, unknown>>,
): void {
    const unused = Object.keys(data).filter(v => keys.indexOf(v) === -1);
    if (unused.length !== 0) {
        throw new OpCodeError(
            `There are unused application keys: "${unused.join('", "')}"`,
        );
    }
    const notFound = Object.keys(keys).filter(v => data[v] === undefined);
    if (notFound.length !== 0) {
        throw new OpCodeError(
            `There are undefined application keys: "${notFound.join('", "')}"`,
        );
    }
}

const opCodeMap: {
    [Key in OpCodeType]: (args: string[], context: Context) => string;
} = {
    // Usage: !P[key|height]
    [OpCodeType.Picture]: (args, context) => {
        shouldHaveLength(OpCodeType.Picture, args, 2);

        context.picture.key = args[0];
        context.picture.height = args[1];
        return '';
    },
    // Usage: !PK[key]
    [OpCodeType.PictureKey]: (args, context) => {
        shouldHaveLength(OpCodeType.PictureKey, args, 1);

        return getOrCreatePictureLabel(context, args[0]);
    },
    // Usage: !T[key|label]
    [OpCodeType.Table]: (args, context) => {
        shouldHaveLength(OpCodeType.Table, args, 2);

        context.table.key = args[0];
        context.table.label = args[1];
        return '';
    },
    // Usage: !TK[key]
    [OpCodeType.TableKey]: (args, context) => {
        shouldHaveLength(OpCodeType.PictureKey, args, 1);

        return getOrCreatePictureLabel(context, args[0]);
    },
    // Usage: !C[key|label]
    [OpCodeType.Code]: (args, context) => {
        shouldHaveLength(OpCodeType.Code, args, 2);

        context.code.key = args[0];
        context.code.label = args[1];
        return '';
    },
    // Usage: !MS[]
    [OpCodeType.MinusSingle]: (args, context) => {
        return '\\minussingle\n';
    },
    // Usage: !AR[key|title|text]
    [OpCodeType.ApplicationRaw]: (args, context) => {
        shouldHaveLength(OpCodeType.ApplicationRaw, args, 3);

        context.applications.keyToData[args[0]] = {
            title: args[1],
            text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{${args[1]}}

${args[2]}
`,
        };
        return '';
    },
    // Usage: !AP[key|title|file_name]
    [OpCodeType.ApplicationPicture]: (args, context) => {
        shouldHaveLength(OpCodeType.ApplicationPicture, args, 3);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{${args[1]}}

\\text{}

{
\\centering
\\includegraphics[width=16.9cm]{${args[2]}]
}
`,
        });
        return '';
    },
    // Usage: !APR[key|title|file_name]
    [OpCodeType.ApplicationPictureRotated]: (args, context) => {
        shouldHaveLength(OpCodeType.ApplicationPictureRotated, args, 3);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\begin{landscape}
    \\thispagestyle{empty}
    \\subtitle{Приложение ${label}}

    \\section*{${args[1]}}
    
    \\text{}

    {\\centering
        \\includegraphics[height=13.5cm]{${args[2]}}
    }

    \\vfill
    \\raisebox{.6ex}{\\makebox[\\linewidth]{\\thepage}}
\\end{landscape}
`,
        });
        return '';
    },
    // Usage: !AC[key|directory|file_name|language]
    [OpCodeType.ApplicationCode]: (args, context) => {
        shouldHaveLength(OpCodeType.ApplicationCode, args, 4);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{${args[1]}}

\\text{}

\\fontsize{12}{12}\\selectfont
\\inputminted[baselinestretch=1.2]{${args[3]}}{${args[2]}}
\\fontsize{${context.config.defaultFontSize}}{${context.config.defaultFontSize}}\\selectfont
`,
        });
        return '';
    },
    // Usage: !AK[key]
    [OpCodeType.ApplicationKey]: (args, context) => {
        shouldHaveLength(OpCodeType.ApplicationKey, args, 1);

        return getApplicationLabelByKey(context, args[0]);
    },
    // Usage: !RR[key|text]
    [OpCodeType.ReferenceRaw]: (args, context) => {
        shouldHaveLength(OpCodeType.ReferenceRaw, args, 2);

        addReferenceByKey(context, args[0], {
            text: label => `
${label}.\\,${args[1]}`,
        });
        return '';
    },
    // Usage: !RK[key]
    [OpCodeType.ReferenceKey]: (args, context) => {
        shouldHaveLength(OpCodeType.ReferenceKey, args, 1);

        return getReferenceLabelByKey(context, args[0]);
    },
    // Usage: !LAA[]
    [OpCodeType.ListAllApplications]: (args, context) => {
        const keys = context.applications.accessKeys;
        const data = context.applications.keyToData;
        compareKeyArrayAndMap(keys, data);

        return keys
            .map(key => data[key].text(getApplicationLabelByKey(context, key)))
            .join('\n\n');
    },
    // Usage: !LAR[]
    [OpCodeType.ListAllReferences]: (args, context) => {
        const keys = context.references.accessKeys;
        const data = context.references.keyToData;
        compareKeyArrayAndMap(keys, data);

        return keys
            .map(key => data[key].text(getReferenceLabelByKey(context, key)))
            .join('\n\n');
    },
};
