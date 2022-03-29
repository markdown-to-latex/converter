import { getLatexOrderedListPoint, LatexString } from './index';
import { Escaper } from './escaper';
import { LatexInfoStrict } from '../context';
import { NodeType } from '../../ast/nodes';

export interface LatexListItemInfo {
    text: string;
    depth: number;
    index: number;
    isOrdered: boolean;
}

export function getLatexListItem(data: LatexListItemInfo, _: LatexInfoStrict) {
    const point = data.isOrdered
        ? getLatexOrderedListPoint(data.depth, data.index) + ')'
        : '-';

    return `\n\n\\hspace{${1.25 * (data.depth - 1)}cm}${point}\\,${
        data.text
    }\n\n`;
}

export interface LatexImageInfo {
    pictureLabel: string;
    pictureTitle: string;
    height: string;
    href: string;
    removeSpace: boolean;
}

export function getLatexImage(
    info: LatexImageInfo,
    config: LatexInfoStrict,
): string {
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
    \\includegraphics[height=${info.height}]{${info.href}}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок ${info.pictureLabel} -- ${info.pictureTitle}}
\\end{figure}
`;
}

export interface LatexTableInfo {
    tableLabel: string;
    tableTitle: string;
    header: string;
    content: string;
    colAmount: number;
    removeSpace: boolean;
}

export function getLatexTable(
    info: LatexTableInfo,
    config: LatexInfoStrict,
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
    \\caption{Таблица ${info.tableLabel} -- ${info.tableTitle}}
    \\\\\\hline
    ${info.header}
    \\endfirsthead
    \\caption{Продолжение таблицы ${info.tableLabel}} \\\\\\hline
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
    codeLabel: string;
    codeTitle: string;
    lang: string;
    text: string;
    removeSpace: boolean;
}

export function getLatexCode(
    info: LatexCodeInfo,
    config: LatexInfoStrict,
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
    \\caption{Рисунок ${info.codeLabel} -- ${info.codeTitle}}
\\end{figure}
`;
}

export function getLatexMath(text: string, config: LatexInfoStrict): string {
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

export function getLatexInlineMath(text: string, _: LatexInfoStrict): string {
    return `\\displaystyle ${text}`;
}

export function getLatexCodeSpan(text: string, config: LatexInfoStrict) {
    // TODO: store escaper in context

    text = Escaper.fromConfigLatex(config)
        .prepare({
            nodeType: NodeType.CodeSpan,
        })
        .apply(text).s;

    return config.useMonospaceFont ? `\\texttt{${text}}` : text;
}

type LinkAsType = NonNullable<LatexInfoStrict['useLinkAs']>;
const linkTextWrapper: {
    [Key in LinkAsType]: (text: string, config: LatexInfoStrict) => string;
} = {
    bold: text => `\\textbf{${text}}`,
    italic: text => `\\textit{${text}}`,
    code: text => `\\texttt{${text}}`,
    underline: text => `\\underline{${text}}`,
    default: text => text,
};

export function getLatexLinkText(
    text: string,
    title: string,
    config: LatexInfoStrict,
) {
    return linkTextWrapper[config.useLinkAs ?? 'default'](text, config);
}
