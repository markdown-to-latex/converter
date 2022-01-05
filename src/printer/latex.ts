import { LatexInfo } from './types';

export class LatexError extends Error {
    constructor(m: string) {
        super(m);

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, LatexError.prototype);
    }
}

const escapeDeReplacements: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
};

/**
 * See https://github.com/markedjs/marked/blob/288f1cbe2f55881972c0f594ddb9910888986bee/src/helpers.js#L8
 */
function resolveTextDeReplacements(text: string): string {
    for (const dereplacement of Object.keys(escapeDeReplacements)) {
        const regexp = new RegExp(dereplacement, 'g');
        text = text.replace(regexp, escapeDeReplacements[dereplacement]);
    }

    return text;
}

export function prepareTextForLatex(text: string): string {
    text = resolveTextDeReplacements(text);
    text = text.replace(/%/g, '\\%');
    return text;
}

export function prettifyLaTeX(text: string): string {
    text = text.replace(/\n{3,}/g, '\n\n');

    // Remove unnecessary breaks in begin and end of the file
    text = text.replace(/^\n+/g, '');
    text = text.replace(/\n{2,}$/g, '\n');
    return text;
}

const headerByDepth: ((text: string) => string)[] = [
    text => `\\subtitle{${text}}`,
    text => `\\section{${text}}`,
    text => `\\subsection{${text}}`,
];

export function getLatexHeader(text: string, depth: number): string {
    const lazyResult = headerByDepth[depth - 1];
    if (lazyResult === undefined) {
        throw new LatexError(`Cannot process header with depth ${depth}`);
    }

    return lazyResult(text) + '\n\n';
}

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

export function getLatexApplicationLetter(index: number): string {
    if (applicationLetters[index] === undefined) {
        throw new LatexError(
            `Index ${index} is out of range application letters`,
        );
    }

    return applicationLetters[index];
}

function getLatexOrderedListPoint(depth: number, index: number): string {
    if (!(0 < depth && depth < 3)) {
        throw new LatexError(`Depth ${depth} of ordered list is out of range`);
    }

    if (depth === 1) {
        const letter = applicationLetters.map(char => char.toLowerCase())[
            index
        ];
        if (letter === undefined) {
            throw new LatexError(
                `Cannot found letter for index ${index} in ordered list`,
            );
        }

        return letter;
    }

    return (index + 1).toString();
}

export function getLatexListItem(
    text: string,
    depth: number,
    index: number,
    isOrdered: boolean,
) {
    const point = isOrdered
        ? getLatexOrderedListPoint(depth, index) + ')'
        : '-';

    return `\n\n\\hspace{${1.25 * (depth - 1)}cm}${point}\\,${text}\n\n`;
}

export function getLatexImage(
    pictureLabel: string,
    pictureTitle: string,
    height: string,
    href: string,
    removeSpace: boolean,
): string {
    return `
\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}${
        removeSpace ? '\n\\addtolength{\\belowcaptionskip}{-1.6em}' : ''
    }
\\setlength{\\abovecaptionskip}{.5em}

\\begin{figure}[H]
    \\centering
    \\includegraphics[height=${height}]{${href}}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty,margin={0pt,0cm},font={stretch=1.5}}
    \\caption{Рисунок ${pictureLabel} -- ${pictureTitle}}
\\end{figure}
`;
}

export function getLatexTable(
    tableLabel: string,
    tableTitle: string,
    header: string,
    content: string,
    colAmount: number,
    removeSpace: boolean,
): string {
    let colsTemplate = `|`;
    for (let i = 0; i < colAmount; i++) {
        colsTemplate += 'c|';
    }

    return `

\\fontsize{\\tablefontsize}{\\tablefontsize}\\selectfont
\\setlength{\\belowcaptionskip}{0em}
\\setlength{\\abovecaptionskip}{0em}
\\setlength{\\LTpre}{2em}
${removeSpace ? '\\setlength{\\LTpost}{0em}' : '\\setlength{\\LTpost}{2em}'}

\\begin{longtable}[H]{${colsTemplate}}
    \\captionsetup{justification=justified,indention=0cm,labelformat=empty, margin={2pt, 0cm},font={stretch=1.5}}
    \\caption{Таблица ${tableLabel} -- ${tableTitle}}
    \\\\\\hline
    ${header}
    \\endfirsthead
    \\caption{Продолжение таблицы ${tableLabel}} \\\\\\hline
    ${header}
    \\endhead
    \\endfoot
    \\endlastfoot

${content}
\\end{longtable}
\\fontsize{\\defaultfontsize}{\\defaultfontsize}\\selectfont\\setstretch{1.5}

`;
}

export function getLatexCode(
    codeLabel: string,
    codeTitle: string,
    lang: string,
    text: string,
    removeSpace: boolean,
): string {
    return `
\\setlength{\\intextsep}{3em}
\\setlength{\\belowcaptionskip}{-4ex}${
        removeSpace ? '\n\\addtolength{\\belowcaptionskip}{-1.6em}' : ''
    }
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{\\codefontsize}{\\codefontsize}\\selectfont
    \\begin{minted}
    [baselinestretch=1.2]{${lang}}
${text}
    \\end{minted}
    \\captionsetup{justification=centering,indention=0cm,labelformat=empty, margin={0pt, 0cm},font={stretch=1.5}}
    \\caption{Рисунок ${codeLabel} -- ${codeTitle}}
\\end{figure}
`;
}

export function getLatexMath(text: string): string {
    return `
\\setlength{\\abovedisplayskip}{-.9em}
\\setlength{\\belowdisplayskip}{0pt}
\\setlength{\\abovedisplayshortskip}{0pt}
\\setlength{\\belowdisplayshortskip}{0pt}
\\begin{align*}
\\displaystyle
${text}
\\end{align*}    
`;
}

export function getLatexInlineMath(text: string): string {
    return `\\displaystyle ${text}`;
}

export function getLatexCodeSpan(text: string, config: LatexInfo) {
    text = config.autoEscapeUnderscoresCode ? text.replace(/_/g, '\\_') : text;

    return config.useMonospaceFont ? `\\texttt{${text}}` : text;
}
