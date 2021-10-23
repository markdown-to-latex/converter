import {
    addApplicationByKey,
    Context,
    getApplicationLabelByKey,
    getOrCreatePictureLabel,
    getOrCreateTableLabel,
    getReferenceLabelByKey,
} from './context';
import { getNodeRightNeighbourLeaf, NodeType, OpCodeNode } from '../ast/nodes';

export function resolveOpCode(node: OpCodeNode, context: Context): string {
    const lazy = opCodeMap[node.opcode as OpCodeType];
    if (lazy === undefined) {
        throw new OpCodeError(`Unknown OpCode "${node.opcode}"`);
    }

    return lazy(node.arguments, node, context);
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

export class OpCodeError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, OpCodeError.prototype);
    }
}

function shouldHaveLength(
    opCodeType: string,
    args: string[],
    length: number,
): void {
    if (args.length !== length) {
        throw new OpCodeError(
            `OpCode "${opCodeType}" should have exactly ${length} arguments`,
        );
    }
}

function shouldNotBeEmptyArguments(opCodeType: string, args: string[]): void {
    for (const arg of args) {
        if (!arg) {
            throw new OpCodeError(
                `Argument cannot be empty for macros "${opCodeType}"`,
            );
        }
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
    const notFound = keys.filter(v => data[v] === undefined);
    if (notFound.length !== 0) {
        throw new OpCodeError(
            `There are undefined application keys: "${notFound.join('", "')}"`,
        );
    }
}

function shouldHaveNodeWithTypeAfter(
    node: OpCodeNode,
    expected: NodeType[],
    blacklisted: NodeType[],
): void {
    let right = getNodeRightNeighbourLeaf(node);

    while (right !== null && blacklisted.indexOf(right.type) !== -1) {
        right = getNodeRightNeighbourLeaf(right);
    }
    if (right === null) {
        throw new OpCodeError(
            `Expected one of node types after "${
                node.opcode
            }" macros: ${JSON.stringify(expected)}.
Got nothing`,
        );
    }

    if (expected.indexOf(right.type) === -1) {
        throw new OpCodeError(
            `Expected one of node types after "${
                node.opcode
            }" macros: ${JSON.stringify(expected)}.
Got node with type "${right.type}"`,
        );
    }
}

const opCodeMap: {
    [Key in OpCodeType]: (
        args: string[],
        node: OpCodeNode,
        context: Context,
    ) => string;
} = {
    // Usage: !P[key|height]
    [OpCodeType.Picture]: (args, node, context) => {
        shouldHaveLength(node.type, args, 2);
        shouldNotBeEmptyArguments(node.opcode, args);
        shouldHaveNodeWithTypeAfter(
            node,
            [NodeType.Image],
            [NodeType.OpCode, NodeType.Space],
        );

        context.picture.key = args[0];
        context.picture.height = args[1];
        return '';
    },
    // Usage: !PK[key]
    [OpCodeType.PictureKey]: (args, node, context) => {
        shouldHaveLength(node.type, args, 1);
        shouldNotBeEmptyArguments(node.opcode, args);

        return getOrCreatePictureLabel(context, args[0]);
    },
    // Usage: !T[key|label]
    [OpCodeType.Table]: (args, node, context) => {
        shouldHaveLength(node.opcode, args, 2);
        shouldNotBeEmptyArguments(node.opcode, args);
        shouldHaveNodeWithTypeAfter(
            node,
            [NodeType.Table],
            [NodeType.OpCode, NodeType.Space],
        );

        context.table.key = args[0];
        context.table.label = args[1];
        return '';
    },
    // Usage: !TK[key]
    [OpCodeType.TableKey]: (args, node, context) => {
        shouldHaveLength(node.type, args, 1);
        shouldNotBeEmptyArguments(node.opcode, args);

        return getOrCreateTableLabel(context, args[0]);
    },
    // Usage: !C[key|label]
    [OpCodeType.Code]: (args, node, context) => {
        shouldHaveLength(node.type, args, 2);
        shouldNotBeEmptyArguments(node.opcode, args);

        context.code.key = args[0];
        context.code.label = args[1];
        return '';
    },
    // Usage: !MS[]
    [OpCodeType.MinusSingle]: (args, node, context) => {
        return '\\minussingle\n';
    },
    // Usage: !AR[key|title|text]
    [OpCodeType.ApplicationRaw]: (args, node, context) => {
        shouldHaveLength(node.type, args, 3);
        shouldNotBeEmptyArguments(node.opcode, args);

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
    [OpCodeType.ApplicationPicture]: (args, node, context) => {
        shouldHaveLength(node.type, args, 3);
        shouldNotBeEmptyArguments(node.opcode, args);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{${args[1]}}

\\vspace{1em}
\\begin{center}
\\includegraphics[width=16.9cm]{${args[2]}}
\\end{center}
`,
        });
        return '';
    },
    // Usage: !APR[key|title|file_name]
    [OpCodeType.ApplicationPictureRotated]: (args, node, context) => {
        shouldHaveLength(node.type, args, 3);
        shouldNotBeEmptyArguments(node.opcode, args);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\begin{landscape}
    \\thispagestyle{empty}
    \\subtitle{Приложение ${label}}

    \\section*{${args[1]}}
    
    \\vspace{1em}
    \\begin{center}
    \\includegraphics[height=13.8cm]{${args[2]}}
    \\end{center}

    \\vfill
    \\raisebox{.6ex}{\\makebox[\\linewidth]{\\thepage}}
\\end{landscape}
`,
        });
        return '';
    },
    // Usage: !AC[key|directory|file_name|language]
    [OpCodeType.ApplicationCode]: (args, node, context) => {
        shouldHaveLength(node.type, args, 4);
        shouldNotBeEmptyArguments(node.opcode, args);

        addApplicationByKey(context, args[0], {
            title: args[1],
            text: label => `
\\pagebreak
\\subtitle{Приложение ${label}}

\\section*{Листинг кода из файла ${args[2]}}

\\vspace{1em}
\\fontsize{\\applicationcodefontsize}{\\applicationcodefontsize}\\selectfont
\\inputminted[baselinestretch=\\applicationcodelineheight]{${args[3]}}{${args[1]}/${args[2]}}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont
`,
        });
        return '';
    },
    // Usage: !AK[key]
    [OpCodeType.ApplicationKey]: (args, node, context) => {
        shouldHaveLength(node.type, args, 1);
        shouldNotBeEmptyArguments(node.opcode, args);

        return getApplicationLabelByKey(context, args[0]);
    },
    // Usage: !RR[key]
    // Expected code with language "ref" after the Macros
    [OpCodeType.ReferenceRaw]: (args, node, context) => {
        shouldHaveLength(node.type, args, 1);
        shouldNotBeEmptyArguments(node.opcode, args);
        shouldHaveNodeWithTypeAfter(node, [NodeType.Code], [NodeType.Space]);

        context.references.key = args[0];
        return '';
    },
    // Usage: !RK[key]
    [OpCodeType.ReferenceKey]: (args, node, context) => {
        shouldHaveLength(node.type, args, 1);
        shouldNotBeEmptyArguments(node.opcode, args);

        return getReferenceLabelByKey(context, args[0]);
    },
    // Usage: !LAA[]
    [OpCodeType.ListAllApplications]: (args, node, context) => {
        shouldHaveLength(node.type, args, 0);
        shouldNotBeEmptyArguments(node.opcode, args);

        const keys = context.applications.accessKeys;
        const data = context.applications.keyToData;
        compareKeyArrayAndMap(keys, data);

        return keys
            .map(key => data[key].text(getApplicationLabelByKey(context, key)))
            .join('\n\n');
    },
    // Usage: !LAR[]
    [OpCodeType.ListAllReferences]: (args, node, context) => {
        shouldHaveLength(node.type, args, 0);
        shouldNotBeEmptyArguments(node.opcode, args);

        const keys = context.references.accessKeys;
        const data = context.references.keyToData;
        compareKeyArrayAndMap(keys, data);

        return keys
            .map(key => data[key].text(getReferenceLabelByKey(context, key)))
            .join('\n\n');
    },
};
