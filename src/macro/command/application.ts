import { CommandInfo, CommandInfoCallback } from '../struct';
import {
    CodeApplicationNode,
    PictureApplicationNode,
    ProcessedNodeType,
    RawApplicationNode,
} from '../node/struct';
import { Node } from '../../ast/node';
import { ArgInfoType } from '../args';
import {
    DiagnoseErrorType,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';

interface ArgsType {
    title?: Node[];
}

interface RawArgsType extends ArgsType {
    content?: Node[];
}

const callbackRaw: CommandInfoCallback<RawArgsType, string> = function (
    ctx,
    data,
    args,
) {
    if (!args.args.title) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Application macros title argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }
    if (!args.args.content) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Application macros raw argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }

    const node: RawApplicationNode = {
        type: ProcessedNodeType.RawApplication,
        pos: { ...data.node.n.pos },
        parent: data.node.n.parent,
        children: args.args.content,
    };

    ctx.createApplication({
        label: args.label,
        title: args.args.title,
        content: [node],
    });
    return [];
};

interface __PictureArgsType extends ArgsType {
    title: Node[];
    filepath: string;
    rotated: boolean;
}

const __callbackPicture: CommandInfoCallback<__PictureArgsType, string> =
    function (ctx, data, args) {
        const node: PictureApplicationNode = {
            type: ProcessedNodeType.PictureApplication,
            parent: data.node.n.parent,
            pos: { ...data.node.n.pos },
            rotated: args.args.rotated,
            href: args.args.filepath,
        };

        ctx.createApplication({
            label: args.label,
            title: args.args.title,
            content: [node],
        });

        return [];
    };

interface PictureArgsType extends ArgsType {
    filepath?: string;
}

const callbackPicture = (rotated: boolean) =>
    function (ctx, data, args) {
        if (!args.args.title) {
            ctx.c.diagnostic.push(
                nodeToDiagnose(
                    data.node.n,
                    DiagnoseSeverity.Fatal,
                    DiagnoseErrorType.MacrosError,
                    'Application macros title argument is undefined ' +
                        '(internal error)',
                ),
            );

            return [];
        }
        if (!args.args.filepath) {
            ctx.c.diagnostic.push(
                nodeToDiagnose(
                    data.node.n,
                    DiagnoseSeverity.Fatal,
                    DiagnoseErrorType.MacrosError,
                    'Application macros filepath argument is undefined ' +
                        '(internal error)',
                ),
            );

            return [];
        }

        return __callbackPicture(ctx, data, {
            label: args.label,
            args: {
                title: args.args.title,
                filepath: args.args.filepath,
                rotated: rotated,
            },
        });
    } as CommandInfoCallback<PictureArgsType, string>;

const applicationPictureArgs = [
    {
        name: 'title',
        aliases: ['t'],
        type: ArgInfoType.NodeArray,
        onlySpans: true,
        optional: false,
    },
    {
        name: 'filepath',
        aliases: ['f', 'file'],
        type: ArgInfoType.Text,
        onlySpans: true,
        optional: false,
    },
];

interface CodeArgsType {
    directory?: string;
    filename?: string;
    language?: string;
    columns?: string;
}

const callbackCode: CommandInfoCallback<CodeArgsType, string> = function (
    ctx,
    data,
    args,
) {
    if (!args.args.directory) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Application macros directory argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }
    if (!args.args.filename) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Application macros filename argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }
    if (!args.args.language) {
        ctx.c.diagnostic.push(
            nodeToDiagnose(
                data.node.n,
                DiagnoseSeverity.Fatal,
                DiagnoseErrorType.MacrosError,
                'Application macros language argument is undefined ' +
                    '(internal error)',
            ),
        );

        return [];
    }

    const node: CodeApplicationNode = {
        type: ProcessedNodeType.CodeApplication,
        pos: { ...data.node.n.pos },
        parent: data.node.n.parent,
        columns: +(args.args.columns ?? 1),
        lang: args.args.language,
        directory: args.args.directory,
        filename: args.args.filename,
    };

    ctx.createApplication({
        label: args.label,
        title: [],
        content: [node],
    });
    return [];
};

export default [
    {
        args: [
            {
                name: 'title',
                aliases: ['t'],
                type: ArgInfoType.NodeArray,
                onlySpans: true,
                optional: false,
            },
            {
                name: 'content',
                aliases: ['c'],
                type: ArgInfoType.NodeArray,
                onlySpans: false,
                optional: false,
            },
        ],
        name: 'AR',
        callback: callbackRaw,
    },
    {
        args: applicationPictureArgs,
        name: 'AP',
        callback: callbackPicture(false),
    },
    {
        args: applicationPictureArgs,
        name: 'APR',
        callback: callbackPicture(true),
    },
    {
        args: [
            {
                name: 'directory',
                aliases: ['t'],
                type: ArgInfoType.Text,
                onlySpans: true,
                optional: false,
            },
            {
                name: 'filename',
                aliases: ['n', 'name', 'f', 'file'],
                type: ArgInfoType.Text,
                onlySpans: true,
                optional: false,
            },
            {
                name: 'language',
                aliases: ['l', 'lang'],
                type: ArgInfoType.Text,
                onlySpans: true,
                optional: false,
            },
            {
                name: 'columns',
                aliases: ['c', 'cols'],
                type: ArgInfoType.Text,
                onlySpans: true,
                optional: true,
            },
        ],
        name: 'AC',
        callback: callbackCode,
    },
] as CommandInfo[];
