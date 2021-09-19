class LatexError extends Error {}

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
\\setlength{\\intextsep}{3em}  % 3em
\\setlength{\\belowcaptionskip}{-4ex}${
        removeSpace ? '\n\\addtolength{\\belowcaptionskip}{-1em}' : ''
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
): string {
    return `
\\setlength{\\LTpre}{1.5em}
\\setlength{\\LTpost}{1.5em}

\\begin{longtable}[H]{|c|c|c|c|c|}
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
        removeSpace ? '\n\\addtolength{\\belowcaptionskip}{-1em}' : ''
    }
\\setlength{\\abovecaptionskip}{-0.5em}

\\begin{figure}[H]
    \\fontsize{12}{12}\\selectfont
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
\\setlength{\\abovedisplayskip}{0pt}
\\setlength{\\belowdisplayskip}{0pt}
\\setlength{\\abovedisplayshortskip}{0pt}
\\setlength{\\belowdisplayshortskip}{0pt}
\\begin{align*}
${text}
\\end{align*}    
`;
}

export function getLatexInlineMath(text: string): string {
    return `$\\displaystyle ${text}$`;
}
