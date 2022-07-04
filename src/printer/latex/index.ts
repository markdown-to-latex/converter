import { Context } from '../context';
import { NodeType } from '../../ast/node';
import { Escaper } from './escaper';
import { StringE } from '../../extension/string';
import { LatexError } from './error';

export class LatexString extends StringE {
    public context: Context;

    public constructor(value: string | StringE, context: Context) {
        super(value);
        this.context = context;
    }

    public prepare(nodeType: NodeType): LatexString {
        // TODO: move escaper into the context

        const stringE = this.resolveDeReplacements();
        return new LatexString(
            stringE.applyEscaper(
                Escaper.fromContext(this.context).prepare({
                    nodeType: nodeType,
                }),
            ),
            this.context,
        );
    }

    public get se(): StringE {
        return this;
    }
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
