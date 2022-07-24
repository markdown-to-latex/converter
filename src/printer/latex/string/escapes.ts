import { NodeType } from '../../../ast/node';
import { StringE } from '../../../extension/string';
import { getConfigEscapes, LatexPrinterConfiguration } from '../config';

export interface LatexPrinterConfigurationEscapeData {
    /**
     * List of words to escape. Replacing is being done case insensitively
     */
    chars: [string, ...string[]];

    /**
     * Replacer RegExp string
     */
    replacer: string;

    /**
     * Escape words in plain text
     */
    inText: boolean;

    /**
     * Escape words in code span
     */
    inCodeSpan: boolean;

    /**
     * Escape words inside a link
     */
    inLink: boolean;
}

/**
 * Default escapes applied to the LaTeX
 *
 * @see https://tex.stackexchange.com/a/34586
 */
export const defaultEscapes: LatexPrinterConfigurationEscapeData[] = [
    {
        chars: ['%', '_', '#', '&'],
        inText: true,
        inCodeSpan: true,
        inLink: true,
        replacer: '\\$1',
    },
    {
        chars: ['\\$'],
        inText: false,
        inCodeSpan: true,
        inLink: true,
        replacer: '\\$1',
    },
    {
        chars: ['{', '}'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\$1',
    },
    {
        chars: ['~'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\textasciitilde',
    },
    {
        chars: ['\\^'],
        inText: false,
        inCodeSpan: true,
        inLink: false,
        replacer: '\\textasciicircum',
    },
    {
        chars: ['"'],
        inText: true,
        inCodeSpan: true,
        inLink: true,
        replacer: '$1{}',
    },
];

type EscaperNodeType = 'text' | 'codeSpan';

interface EscaperDataType {
    type: EscaperNodeType;
}

export class Escaper {
    public escapes: LatexPrinterConfigurationEscapeData[];

    public constructor(escapes: LatexPrinterConfigurationEscapeData[]) {
        this.escapes = escapes;
    }

    public static fromConfigLatex(config: LatexPrinterConfiguration): Escaper {
        return new this(getConfigEscapes(config));
    }

    public static stringArrayToRegexp(strs: string[]): RegExp {
        return new RegExp(`(${strs.join('|')})`, 'gi');
    }

    public prepare(data: { nodeType: NodeType }): EscaperReady {
        return new EscaperReady(
            this.escapes
                .filter(
                    (() => {
                        if (data.nodeType == 'CodeSpan') {
                            return d => d.inCodeSpan;
                        } else if (data.nodeType == 'Link') {
                            return d => d.inLink;
                        } else {
                            return d => d.inText;
                        }
                    })(),
                )
                .map(d => ({
                    regexp: Escaper.stringArrayToRegexp(d.chars),
                    replacer: d.replacer,
                })),
        );
    }
}

interface EscaperReadyData {
    regexp: RegExp;
    replacer: string;
}

export class EscaperReady {
    protected data: EscaperReadyData[];

    public constructor(data: EscaperReadyData[]) {
        this.data = data;
    }

    public apply(text: StringE | string): StringE {
        text = StringE.from(text);
        for (const data of this.data) {
            text = text.replaceE(data.regexp, data.replacer);
        }
        return text;
    }
}
