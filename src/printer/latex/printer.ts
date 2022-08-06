import { Node, NodeAbstract, NodeType } from '../../ast/node';
import { StringE } from '../../extension/string';
import { LatexInterpretation, LatexPrinterConfiguration } from './config';
import { Escaper } from './string/escapes';
import {
    DiagnoseErrorType,
    DiagnoseList,
    DiagnoseSeverity,
    nodeToDiagnose,
} from '../../diagnose';
import { NodeApplication } from '../../macro/node';

export class LatexString extends StringE {
    public config: LatexPrinterConfiguration;

    public constructor(
        value: string | StringE,
        config: LatexPrinterConfiguration,
    ) {
        super(value);
        this.config = config;
    }

    public prepare(nodeType: NodeType): LatexString {
        // TODO: move escaper into the context
        // TODO: do something with it (smells)

        return new LatexString(
            this.applyEscaper(
                Escaper.fromConfigLatex(this.config).prepare({
                    nodeType: nodeType,
                }),
            ),
            this.config,
        );
    }

    public get se(): StringE {
        return this;
    }
}

export interface PrinterFunctionResult {
    result: string;
    diagnostic: DiagnoseList;
}

const headerByDepth: ((text: string) => string)[] = [
    text => `\\section{\\uppercase{${text}}}`,
    text => `\\subsection{${text}}`,
    text => `\\subsubsection{${text}}`,
];

export function getLatexHeader(
    text: string,
    depth: number,
    node: NodeAbstract,
): PrinterFunctionResult {
    const diagnostic: DiagnoseList = [];

    let lazyResult = headerByDepth[depth - 1];
    if (lazyResult === undefined) {
        diagnostic.push(
            nodeToDiagnose(
                node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.LatexPrinterError,
                `Cannot process header with depth ${depth}`,
            ),
        );

        lazyResult = headerByDepth[headerByDepth.length - 1];
    }

    return {
        result: `\n${lazyResult(text)}\n\n`,
        diagnostic,
    };
}

// TODO: localization
const applicationLetters = [
    'А',
    'Б',
    'В',
    'Г',
    'Д',
    'Е',
    'Ж',
    'И',
    'К',
    'Л',
    'М',
    'Н',
    'П',
    'Р',
    'С',
    'Т',
    'У',
    'Ф',
    'Х',
    'Ц',
    'Ш',
    'Щ',
    'Э',
    'Ю',
    'Я',
];

export function getLatexApplicationLetter(
    index: number,
    node: NodeAbstract,
): PrinterFunctionResult {
    const diagnostic: DiagnoseList = [];

    let letter = applicationLetters[index];
    if (letter === undefined) {
        diagnostic.push(
            nodeToDiagnose(
                node,
                DiagnoseSeverity.Warning,
                DiagnoseErrorType.LatexPrinterError,
                `Index ${index} is out of range application letters`,
            ),
        );

        letter = 'Ъ';
    }

    return {
        result: letter,
        diagnostic,
    };
}

export function getLatexOrderedListPoint(
    depth: number,
    index: number,
    node: NodeAbstract,
): PrinterFunctionResult {
    if (!(0 < depth && depth < 3)) {
        return {
            result: '-1',
            diagnostic: [
                nodeToDiagnose(
                    node,
                    DiagnoseSeverity.Warning,
                    DiagnoseErrorType.LatexPrinterError,
                    `Depth ${depth} of ordered list is out of range`,
                ),
            ],
        };
    }

    if (depth === 1) {
        let letter = applicationLetters.map(char => char.toLowerCase())[index];
        if (letter === undefined) {
            return {
                result: 'Ъ',
                diagnostic: [
                    nodeToDiagnose(
                        node,
                        DiagnoseSeverity.Warning,
                        DiagnoseErrorType.LatexPrinterError,
                        `Cannot found letter for index ${index} in ordered list`,
                    ),
                ],
            };
        }

        return {
            result: letter,
            diagnostic: [],
        };
    }

    return {
        result: (index + 1).toString(),
        diagnostic: [],
    };
}

export interface LatexListItemInfo {
    text: string;
    depth: number;
    index: number;
    isOrdered: boolean;
}

export function getLatexListItem(
    data: LatexListItemInfo,
    node: NodeAbstract,
): PrinterFunctionResult {
    const listPointResult = getLatexOrderedListPoint(
        data.depth,
        data.index,
        node,
    );
    const point = data.isOrdered ? listPointResult.result + ')' : '-';

    return {
        result: `\n\n\\hspace{${1.25 * (data.depth - 1)}cm}${point}\\,${
            data.text
        }\n\n`,
        diagnostic: listPointResult.diagnostic,
    };
}

export interface LatexImageInfo {
    pictureIndex: string;
    pictureTitle: string;
    width?: string;
    height?: string;
    href: string;
    removeSpace: boolean;
}

function getLatexDimensions(width?: string, height?: string): string {
    const text = [
        height ? [`height=${height}`] : [],
        width ? [`width=${width}`] : [],
    ]
        .flatMap(v => v)
        .join(',');

    if (text) {
        return `[${text}]`;
    }
    return '';
}

export function getLatexImage(
    info: LatexImageInfo,
    config: LatexPrinterConfiguration,
): string {
    const dimensions = getLatexDimensions(info.width, info.height);

    return `
\\setlength{\\intextsep}{${config.margin!.imageInnerTextSep}}
\\setlength{\\belowcaptionskip}{${config.margin!.imageBelowCaptionSkip}}${
        info.removeSpace
            ? `\n\\addtolength{\\belowcaptionskip}{${
                  config.margin!.imageRemovedBelowCaptionSkip
              }}`
            : ''
    }
\\setlength{\\abovecaptionskip}{${config.margin!.imageAboveCaptionSkip}}

\\begin{figure}[H]
    \\centering
    \\includegraphics${dimensions}{${info.href}}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок ${info.pictureIndex} -- ${info.pictureTitle}}
\\end{figure}
`;
}

export interface LatexTableInfo {
    tableIndex: string;
    tableTitle: string;
    header: string;
    content: string;
    colAmount: number;
    removeSpace: boolean;
}

export function getLatexTable(
    info: LatexTableInfo,
    config: LatexPrinterConfiguration,
): string {
    let colsTemplate = `|`;
    for (let i = 0; i < info.colAmount; i++) {
        colsTemplate += 'c|';
    }

    return `

\\fontsize{\\tablefontsize}{\\tablefontsize}\\selectfont
\\setlength{\\belowcaptionskip}{${config.margin!.tableBelowCaptionSkip}}
\\setlength{\\abovecaptionskip}{${config.margin!.tableAboveCaptionSkip}}
\\setlength{\\LTpre}{${config.margin!.tablePre}}
${
    info.removeSpace
        ? `\\setlength{\\LTpost}{${config.margin!.tableRemovedPost}}`
        : `\\setlength{\\LTpost}{${config.margin!.tablePost}}`
}

\\begin{longtable}[H]{${colsTemplate}}
    \\captionsetup{justification=justified,indention=0cm,labelformat=empty, margin={2pt, 0cm},font={stretch=1.5}}
    \\caption{Таблица ${info.tableIndex} -- ${info.tableTitle}}
    \\\\\\hline
    ${info.header}
    \\endfirsthead
    \\caption{Продолжение таблицы ${info.tableIndex}} \\\\\\hline
    ${info.header}
    \\endhead
    \\endfoot
    \\endlastfoot

${info.content}
\\end{longtable}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont\\setstretch{1.5}

`;
}

export interface LatexCodeInfo {
    codeIndex: string;
    codeTitle: string;
    lang: string;
    text: string;
    removeSpace: boolean;
}

export function getLatexCode(
    info: LatexCodeInfo,
    config: LatexPrinterConfiguration,
): string {
    return `

\\setlength{\\intextsep}{${config.margin!.codeInnerTextSep}}
\\setlength{\\belowcaptionskip}{${config.margin!.codeBelowCaptionSkip}}${
        info.removeSpace
            ? `\n\\addtolength{\\belowcaptionskip}{${
                  config.margin!.codeRemovedBelowCaptionSkip
              }}`
            : ''
    }
\\setlength{\\abovecaptionskip}{${config.margin!.codeAboveCaptionSkip}}

\\begin{figure}[H]
    \\fontsize{\\codefontsize}{\\codefontsize}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{${info.lang}}
${info.text}
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок ${info.codeIndex} -- ${info.codeTitle}}
\\end{figure}
`;
}

export function getLatexMath(
    text: string,
    config: LatexPrinterConfiguration,
): string {
    return `

\\setlength{\\abovedisplayskip}{${config.margin!.mathAboveDisplaySkip}}
\\setlength{\\belowdisplayskip}{${config.margin!.mathBelowDisplaySkip}}
\\setlength{\\abovedisplayshortskip}{${
        config.margin!.mathAboveDisplayShortSkip
    }}
\\setlength{\\belowdisplayshortskip}{${
        config.margin!.mathBelowDisplayShortSkip
    }}
\\begin{align*}
\\displaystyle
${text}
\\end{align*}    
`;
}

export function getLatexInlineMath(
    text: string,
    _: LatexPrinterConfiguration,
): string {
    return `$\\displaystyle ${text}$`;
}

export function getLatexCodeSpan(
    text: string,
    config: LatexPrinterConfiguration,
) {
    text = new StringE(text).applyEscaper(
        Escaper.fromConfigLatex(config).prepare({
            nodeType: NodeType.CodeSpan,
        }),
    ).s;

    return linkTextWrapper[config.useCodeSpanAs](text, config);
}

const linkTextWrapper: {
    [Key in LatexInterpretation]: (
        text: string,
        config: LatexPrinterConfiguration,
    ) => string;
} = {
    bold: text => `\\textbf{${text}}`,
    italic: text => `\\textit{${text}}`,
    monospace: text => `\\texttt{${text}}`,
    underline: text => `\\underline{${text}}`,
    quotes: text => `<<${text}>>`,
};

export function getLatexLinkText(
    text: string,
    link: string,
    title: string,
    config: LatexPrinterConfiguration,
) {
    return linkTextWrapper[config.useLinkAs](link, config);
}

export function getLatexRawApplication(
    index: string,
    innerText: string,
): string {
    return `
\\pagebreak
\\section{\\uppercase{Приложение ${index}}}

${innerText}
`;
}

export interface LatexPictureData {
    index: string;
    title: string;
    filepath: string;
}

export function getLatexRotatedPicture(
    data: LatexPictureData,
    node: NodeAbstract,
): string {
    return `
\\pagebreak
\\begin{landscape}
    \\thispagestyle{empty}
    \\section{\\uppercase{Приложение ${data.index}}}

    \\sectionbutitiscentered{${data.title}}
    
    \\begin{center}
    \\includegraphics[height=13.8cm]{${data.filepath}}
    \\end{center}

    \\vfill
    \\raisebox{.6ex}{\\makebox[\\linewidth]{\\thepage}}
\\end{landscape}
`;
}

export function getLatexPicture(
    data: LatexPictureData,
    node: NodeAbstract,
): string {
    return `
\\pagebreak
\\section{\\uppercase{Приложение ${data.index}}}

\\sectionbutitiscentered{${data.title}}

\\begin{center}
\\includegraphics[width=16.9cm]{${data.filepath}}
\\end{center}
`;
}

export interface LatexApplicationCode {
    index: string;
    filename: string;
    directory: string;
    columns: number;
    language: string;
}

export function getLatexApplicationCode(
    data: LatexApplicationCode,
    node: NodeAbstract,
): string {
    return `
\\pagebreak
\\section{\\uppercase{Приложение ${data.index}}}

\\sectionbutitiscentered{Листинг кода из файла ${data.filename}}

\\fontsize{\\applicationcodefontsize}{\\applicationcodefontsize}\\selectfont
${data.columns !== 1 ? `\\begin{multicols}{${data.columns}}` : ''}
\\inputminted[baselinestretch=\\applicationcodelineheight]{${data.language}}{${
        data.directory
    }/${data.filename}}
${data.columns !== 1 ? `\\end{multicols}` : ''}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont
`;
}
