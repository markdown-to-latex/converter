import {
    findNodeData,
    getNodeRightNeighbourLeaf,
    ListNode,
    NodeAbstract,
    NodeType,
    RawNodeType,
} from '../../ast/node';

import { NodesByType, RawNodesByType } from '../../ast/nodes';
import { ProcessedNodeType } from '../../macro/node';
import { PrinterVisitorResult } from '../struct';
import { ProcessedNodesByType } from '../../macro/nodes';
import { LatexPrinter } from './index';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';
import {
    getLatexApplicationCode,
    getLatexApplicationLetter,
    getLatexCode,
    getLatexCodeSpan,
    getLatexHeader,
    getLatexImage,
    getLatexInlineMath,
    getLatexLinkText,
    getLatexListItem,
    getLatexMath,
    getLatexPicture,
    getLatexRawApplication,
    getLatexRotatedPicture,
    getLatexTable,
    LatexString,
} from './printer';

function isNodeBeforeBoxed(node: NodeAbstract): boolean {
    let right = getNodeRightNeighbourLeaf(node);

    while (
        right !== null &&
        [NodeType.Space, NodeType.OpCode].indexOf(
            right.type as keyof NodesByType,
        ) !== -1
    ) {
        right = getNodeRightNeighbourLeaf(right);
    }
    if (right === null) {
        return false;
    }

    return (
        [
            NodeType.Code,
            NodeType.Table,
            NodeType.Image,
            ProcessedNodeType.CodeProcessed,
            ProcessedNodeType.TableProcessed,
            ProcessedNodeType.PictureProcessed,
        ].indexOf(right.type as keyof NodesByType) !== -1
    );
}

// Editing

type AllNodesByType = RawNodesByType & NodesByType & ProcessedNodesByType;

export type LatexPrinterVisitor<T = NodeAbstract> = (
    printer: LatexPrinter,
    node: T,
) => PrinterVisitorResult;

export type LatexPrinterVisitorList<T = NodeAbstract> = (
    printer: LatexPrinter,
    node: T[],
    separator?: string,
) => PrinterVisitorResult;

export type ProcessingVisitors = {
    [Key in keyof AllNodesByType]: LatexPrinterVisitor<AllNodesByType[Key]>;
};

const unparsableNodeType: LatexPrinterVisitor = (printer, node) => ({
    result: '',
    diagnostic: [
        nodeToDiagnose(
            node,
            DiagnoseSeverity.Warning,
            DiagnoseErrorType.PrinterError,
            `Unable to print node with type '${node.type}'`,
        ),
    ],
});

const internalUnparsableNodeType: LatexPrinterVisitor = (printer, node) => ({
    result: '',
    diagnostic: [
        nodeToDiagnose(
            node,
            DiagnoseSeverity.Warning,
            DiagnoseErrorType.PrinterError,
            `Unable to print node with type '${node.type}' (internal error)`,
        ),
    ],
});

export const processingVisitors: ProcessingVisitors = {
    [RawNodeType.Raw]: internalUnparsableNodeType,
    [RawNodeType.Tokens]: internalUnparsableNodeType,
    [RawNodeType.SoftBreak]: internalUnparsableNodeType,
    [RawNodeType.ParagraphBreak]: internalUnparsableNodeType,
    [RawNodeType.TextBreak]: internalUnparsableNodeType,

    [NodeType.Space]: () => ({
        result: '\n',
        diagnostic: [],
    }),
    [NodeType.Code]: internalUnparsableNodeType,
    [ProcessedNodeType.CodeProcessed]: (printer, node) => {
        const nameResult = printer.processNodeList(printer, node.name);
        return {
            result: getLatexCode(
                {
                    codeIndex: (node.index + 1).toString(),
                    codeTitle: nameResult.result,
                    lang: node.lang ?? 'text',
                    text: node.text,
                    removeSpace: isNodeBeforeBoxed(node),
                },
                printer.config,
            ),
            diagnostic: nameResult.diagnostic,
        };
    },
    [NodeType.Heading]: (printer, node) => {
        const textResult = printer.processNodeList(printer, node.children);
        const headerResult = getLatexHeader(
            textResult.result,
            node.depth,
            node,
        );
        return {
            diagnostic: [...textResult.diagnostic, ...headerResult.diagnostic],
            result: headerResult.result,
        };
    },
    [NodeType.Table]: internalUnparsableNodeType,
    [ProcessedNodeType.TableProcessed]: (printer, node) => {
        const diagnostic: DiagnoseList = [];
        const nameResult = printer.processNodeList(printer, node.name);
        diagnostic.push(...nameResult.diagnostic);
        const headerResult = printer.processNodeList(printer, node.header);
        diagnostic.push(...headerResult.diagnostic);
        const contentResult = printer.processNodeList(printer, node.rows);
        diagnostic.push(...contentResult.diagnostic);

        return {
            result: getLatexTable(
                {
                    tableIndex: (node.index + 1).toString(),
                    tableTitle: nameResult.result,
                    header: headerResult.result,
                    content: contentResult.result,
                    colAmount: node.header[0].children.length,
                    removeSpace: isNodeBeforeBoxed(node),
                },
                printer.config,
            ),
            diagnostic,
        };
    },
    [NodeType.Blockquote]: unparsableNodeType,
    [NodeType.List]: (printer, node) =>
        printer.processNodeList(printer, node.children),
    [NodeType.ListItem]: (printer, node) => {
        let parentList: null | ListNode = null;
        let parent = node.parent;
        let depth = 0;

        const diagnostic: DiagnoseList = [];

        while (parent !== null) {
            if (parent.type === NodeType.List) {
                parentList ??= parent as ListNode;
                ++depth;
            }
            parent = parent.parent;
        }
        if (parentList === null) {
            diagnostic.push(
                nodeToDiagnose(
                    node,
                    DiagnoseSeverity.Error,
                    DiagnoseErrorType.PrinterError,
                    'Cannot find List parent for ListItem (internal error)',
                ),
            );

            return {
                result: '',
                diagnostic,
            };
        }

        const index = findNodeData(node).index;
        const childrenResult = printer.processNodeList(printer, node.children);
        diagnostic.push(...childrenResult.diagnostic);

        const latexItemResult = getLatexListItem(
            {
                text: childrenResult.result,
                depth: depth,
                index: index,
                isOrdered: parentList.ordered,
            },
            node,
        );
        return {
            result: latexItemResult.result,
            diagnostic,
        };
    },
    [NodeType.Paragraph]: (printer, node) => {
        const result = printer.processNodeList(printer, node.children);
        return {
            result: `\n${result.result}\n`,
            diagnostic: result.diagnostic,
        };
    },
    [NodeType.Def]: unparsableNodeType,
    [NodeType.Escape]: (printer, node) => {
        const text = new LatexString(node.text, printer.config).prepare(
            NodeType.Escape,
        ).s;
        return {
            result: `\\${text}`,
            diagnostic: [],
        };
    },
    [NodeType.Text]: (printer, node) => {
        const text = new LatexString(node.text, printer.config).prepare(
            NodeType.Text,
        ).s;

        return {
            result: text,
            diagnostic: [],
        };
    },
    [NodeType.Html]: unparsableNodeType,
    [NodeType.Link]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);

        return {
            result: getLatexLinkText(
                childrenResult.result,
                new LatexString(node.href, printer.config).prepare(
                    NodeType.Link,
                ).s,
                childrenResult.result,
                printer.config,
            ),
            diagnostic: childrenResult.diagnostic,
        };
    },
    [NodeType.Image]: internalUnparsableNodeType,
    [ProcessedNodeType.PictureProcessed]: (printer, node) => {
        const nameResult = printer.processNodeList(printer, node.name);

        const imageResult = getLatexImage(
            {
                pictureIndex: (node.index + 1).toString(),
                pictureTitle: nameResult.result,
                height: node.height,
                width: node.width,
                href: node.href,
                removeSpace: isNodeBeforeBoxed(node),
            },
            printer.config,
        );

        return {
            result: imageResult,
            diagnostic: [...nameResult.diagnostic],
        };
    },
    [NodeType.Strong]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);

        return {
            result: `\\textbf{${childrenResult.result}}`,
            diagnostic: childrenResult.diagnostic,
        };
    },
    [NodeType.Underline]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);

        return {
            result: `\\underline{${childrenResult.result}}`,
            diagnostic: childrenResult.diagnostic,
        };
    },
    [NodeType.Em]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);
        return {
            result: `\\textit{${childrenResult.result}}`,
            diagnostic: [],
        };
    },
    [NodeType.Hr]: () => ({
        result: '\n\\pagebreak\n',
        diagnostic: [],
    }),
    [NodeType.CodeSpan]: (printer, node) => {
        const codeResult = getLatexCodeSpan(node.text, printer.config);

        return {
            result: codeResult,
            diagnostic: [],
        };
    },
    [NodeType.Br]: () => ({
        result: '\n\n',
        diagnostic: [],
    }),
    [NodeType.Del]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);

        return {
            result: `~${childrenResult.result}~`,
            diagnostic: childrenResult.diagnostic,
        };
    },
    [NodeType.File]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);

        const content = new LatexString(
            childrenResult.result,
            printer.config,
        ).removeUnnecessaryLineBreaks().s;

        return { result: content, diagnostic: [...childrenResult.diagnostic] };
    },

    [NodeType.NonBreakingSpace]: () => ({
        result: '~',
        diagnostic: [],
    }),
    [NodeType.ThinNonBreakingSpace]: () => ({
        result: '\\,',
        diagnostic: [],
    }),

    [NodeType.TableCell]: (printer, node) =>
        printer.processNodeList(printer, node.children),
    [NodeType.TableRow]: (printer, node) => {
        const childrenResult = printer.processNodeList(
            printer,
            node.children,
            ' & ',
        );
        return {
            result: childrenResult.result + '\\\\ \\hline\n',
            diagnostic: childrenResult.diagnostic,
        };
    },

    // TODO: Control sequences
    [NodeType.TableControlRow]: () => ({
        result: '',
        diagnostic: [],
    }),
    // TODO: Control sequences
    [NodeType.TableControlCell]: () => ({
        result: '',
        diagnostic: [],
    }),

    [NodeType.OpCode]: internalUnparsableNodeType,
    [NodeType.Latex]: (printer, node) => ({
        result: node.text,
        diagnostic: [],
    }),
    [NodeType.LatexSpan]: (printer, node) => ({
        result: node.text,
        diagnostic: [],
    }),
    [NodeType.Formula]: (printer, node) => ({
        result: getLatexMath(node.text, printer.config),
        diagnostic: [],
    }),
    [NodeType.FormulaSpan]: (printer, node) => ({
        result: getLatexInlineMath(node.text, printer.config),
        diagnostic: [],
    }),
    [NodeType.Comment]: internalUnparsableNodeType,

    [ProcessedNodeType.PictureKey]: (printer, node) => ({
        result: (node.index + 1).toString(),
        diagnostic: [],
    }),
    [ProcessedNodeType.TableKey]: (printer, node) => ({
        result: (node.index + 1).toString(),
        diagnostic: [],
    }),
    [ProcessedNodeType.ApplicationKey]: (printer, node) =>
        getLatexApplicationLetter(node.index, node),
    [ProcessedNodeType.ReferenceKey]: (printer, node) => ({
        result: (node.index + 1).toString(),
        diagnostic: [],
    }),

    [ProcessedNodeType.AllApplications]: (printer, node) =>
        printer.processNodeList(printer, node.children),
    [ProcessedNodeType.AllReferences]: (printer, node) =>
        printer.processNodeList(printer, node.children),

    [ProcessedNodeType.RawApplication]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);
        const indexResult = getLatexApplicationLetter(node.index, node);

        return {
            result: getLatexRawApplication(
                indexResult.result,
                childrenResult.result,
            ),
            diagnostic: [
                ...indexResult.diagnostic,
                ...childrenResult.diagnostic,
            ],
        };
    },

    [ProcessedNodeType.PictureApplication]: (printer, node) => {
        const titleResult = printer.processNodeList(printer, node.title);
        const indexResult = getLatexApplicationLetter(node.index, node);

        return {
            result: (node.rotated ? getLatexRotatedPicture : getLatexPicture)(
                {
                    index: indexResult.result,
                    title: titleResult.result,
                    filepath: node.href,
                },
                node,
            ),
            diagnostic: [...titleResult.diagnostic, ...indexResult.diagnostic],
        };
    },

    [ProcessedNodeType.CodeApplication]: (printer, node) => {
        const indexResult = getLatexApplicationLetter(node.index, node);

        return {
            result: getLatexApplicationCode(
                {
                    columns: node.columns,
                    index: indexResult.result,
                    language: node.lang,
                    directory: node.directory,
                    filename: node.filename,
                },
                node,
            ),
            diagnostic: [...indexResult.diagnostic],
        };
    },

    [ProcessedNodeType.Reference]: (printer, node) => {
        const childrenResult = printer.processNodeList(printer, node.children);
        const index = (node.index + 1).toString();

        return {
            result: `${index}.\\,${childrenResult.result}\n\n`,
            diagnostic: childrenResult.diagnostic,
        };
    },
};
