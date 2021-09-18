import {
    findNodeData,
    getNodeNeighbours,
    HeadingNode,
    ListNode,
    Node,
    NodeType,
} from '../ast/nodes';
import { NodesByType } from '../processing/nodes';
import {
    Context,
    getOrCreatePictureLabel,
    getOrCreateTableLabel,
} from './context';
import { resolveOpCode } from './opcodes';

type Visitor<T extends Node> = (node: T, context: Context) => string;

export function applyPrinterVisitors(node: Node, context: Context): string {
    const visitor = processingVisitors[node.type] as Visitor<Node>;
    return visitor(node, context);
}

export function printNodeList(
    nodes: readonly Node[],
    context: Context,
    separator: string = '',
): string {
    return nodes
        .map(node => applyPrinterVisitors(node, context))
        .join(separator);
}

class ProcessingError extends Error {}

function throwProcessingError(node: Node): string {
    throw new ProcessingError(
        `"${node.type}" node is not available for LaTeX processing`,
    );
}

function isNodeBeforeBoxed(node: Node): boolean {
    const { right } = getNodeNeighbours(node);
    if (!right) {
        return false;
    }

    return (
        ([NodeType.Code, NodeType.Table, NodeType.Image] as NodeType[]).filter(
            v => v == right.type,
        ).length !== 0
    );
}

const headerByDepth: Record<
    number,
    (node: HeadingNode, context: Context) => string
> = {
    [1]: (node, context) =>
        `\\subtitle{${printNodeList(node.children, context, ' ')}}`,
    [2]: (node, context) =>
        `\\section{${printNodeList(node.children, context, ' ')}}`,
    [3]: (node, context) =>
        `\\subsection{${printNodeList(node.children, context, ' ')}}`,
};

const orderedListPoints: Record<number, Record<number, string>> = {
    [1]: {
        [0]: 'а',
        [1]: 'б',
        [2]: 'в',
        [3]: 'г',
        [4]: 'д',
        [5]: 'е',
        [6]: 'ж',
        [7]: 'и',
        [8]: 'к',
        [9]: 'л',
        [10]: 'м',
        [11]: 'н',
        [12]: 'п',
        [13]: 'р',
        [14]: 'с',
        [15]: 'т',
        [16]: 'у',
        [17]: 'ф',
        [18]: 'х',
        [19]: 'ц',
        [20]: 'ш',
        [21]: 'щ',
        [22]: 'э',
        [23]: 'ю',
        [24]: 'я',
    },
    [2]: {
        [0]: '1',
        [1]: '2',
        [2]: '3',
        [3]: '4',
        [4]: '5',
        [5]: '6',
        [6]: '7',
        [7]: '8',
        [8]: '9',
        [9]: '10',
        [10]: '11',
        [11]: '12',
        [12]: '13',
        [13]: '14',
        [14]: '15',
        [15]: '16',
        [16]: '17',
        [17]: '18',
        [18]: '19',
        [19]: '20',
        [20]: '21',
        [21]: '22',
        [22]: '23',
        [23]: '24',
    },
};

// Editing

const processingVisitors: {
    [Key in keyof NodesByType]: Visitor<NodesByType[Key]>;
} = {
    [NodeType.Space]: () => '\n',
    [NodeType.Code]: (node, context) => {
        return `
\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}
${isNodeBeforeBoxed(node) ? '\\addtolength{\\belowcaptionskip}{-1em}' : ''}
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{12}{12}\\selectfont
    \\begin{minted}
    [
    baselinestretch=1.2
    ]{${node.lang}}
${node.text}
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок ${getOrCreatePictureLabel(
        context,
        context.code.key,
    )} -- ${context.code.label}}
\\end{figure}
`;
    },
    [NodeType.Heading]: (node, context) => {
        const lazyResult = headerByDepth[node.depth];
        if (lazyResult === undefined) {
            throw new ProcessingError(
                `Cannot process header with depth ${node.depth}`,
            );
        }

        return lazyResult(node, context) + '\n\n';
    },
    [NodeType.Table]: (node, context) => {
        return `
\\setlength{\\LTpre}{1.5em}
\\setlength{\\LTpost}{1.5em}

\\begin{longtable}[H]{|c|c|c|c|c|}
    \\captionsetup{justification=justified,indention=0cm,labelformat=empty, margin={2pt, 0cm},font={stretch=1.5}}
    \\caption{Таблица ${getOrCreateTableLabel(context, context.table.key)} -- ${
            context.table.label
        }}
    \\\\\\hline
    ${printNodeList(node.header, context)}
    \\endfirsthead
    \\caption{Продолжение таблицы ${getOrCreateTableLabel(
        context,
        context.table.key,
    )}} \\\\\\hline
    ${printNodeList(node.header, context)}
    \\endhead
    \\endfoot
    \\endlastfoot

${printNodeList(node.rows, context)}
\\end{longtable}
`;
    },
    [NodeType.Blockquote]: (node, context) =>
        printNodeList(node.children, context),
    [NodeType.List]: (node, context) => printNodeList(node.children, context),
    [NodeType.ListItem]: (node, context) => {
        let parentList: null | ListNode = null;
        let parent = node.parent;
        let depth = 0;

        while (parent !== null) {
            if (parent.type === NodeType.List) {
                parentList ??= parent as ListNode;
                ++depth;
            }
            parent = parent.parent;
        }
        if (parentList === null) {
            throw new ProcessingError('Cannot find List parent for ListItem');
        }

        const point = parentList.ordered
            ? orderedListPoints[depth][findNodeData(node).index]
            : '-';
        return `\n\n\\hspace{${1.25 * (depth - 1)}cm}${point}\\,${printNodeList(
            node.children,
            context,
        )}\n\n`;
    },
    [NodeType.Paragraph]: (node, context) =>
        printNodeList(node.children, context) + '\n',
    [NodeType.Def]: throwProcessingError,
    [NodeType.Escape]: throwProcessingError,
    [NodeType.Text]: (node, context) => {
        const children = node.children;
        if (children.length === 0) {
            return node.text;
        }

        return printNodeList(children, context);
    },
    [NodeType.Html]: throwProcessingError,
    [NodeType.Link]: throwProcessingError,
    [NodeType.Image]: (node, context) => {
        return `
\\setlength{\\intextsep}{3em}  % 3em
\\setlength{\\belowcaptionskip}{-4ex}
${isNodeBeforeBoxed(node) ? '\\addtolength{\\belowcaptionskip}{-1em}' : ''}
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=${context.picture.height}]{${node.href}}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок ${getOrCreatePictureLabel(
        context,
        context.picture.key,
    )} -- ${node.text}}
\\end{figure}
`;
    },
    [NodeType.Strong]: (node, context) =>
        `\\textbf{${printNodeList(node.children, context)}}`,
    [NodeType.Em]: throwProcessingError,
    [NodeType.Hr]: () => '\n\\pagebreak\n',
    [NodeType.CodeSpan]: node => `\\texttt{${node.text}}`,
    [NodeType.Br]: () => '\n\n',
    [NodeType.Del]: throwProcessingError,

    [NodeType.File]: (node, context) => {
        const content = printNodeList(node.children, context);
        context.writeFile(content, node.path, context);

        return content;
    },
    [NodeType.TableCell]: (node, context) =>
        printNodeList(node.children, context),
    [NodeType.TableRow]: (node, context) => {
        return printNodeList(node.children, context, ' & ') + '\\\\ \\hline\n';
    },
    [NodeType.OpCode]: resolveOpCode,
    [NodeType.InlineLatex]: node => node.text,
    [NodeType.MathLatex]: node => `
\\setlength{\\abovedisplayskip}{0pt}
\\setlength{\\belowdisplayskip}{0pt}
\\setlength{\\abovedisplayshortskip}{0pt}
\\setlength{\\belowdisplayshortskip}{0pt}
\\begin{align*}
${node.text}
\\end{align*}    
`,
};
