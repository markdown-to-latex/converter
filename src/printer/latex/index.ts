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

export function escapeUnderscoredText(text: string) {
    return text.replace(/_/g, '\\_');
}

export function prepareTextForLatex(text: string): string {
    text = resolveTextDeReplacements(text);
    text = text.replace(/%/g, '\\%');
    text = text.replace(/&/g, '\\&');
    text = text.replace(/#/g, '\\#');
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

export function getLatexOrderedListPoint(depth: number, index: number): string {
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
