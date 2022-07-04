import { LatexEscapeData, LatexInfo } from '../types';
import { Context, RequiredProperty } from '../context';
import { getConfigLatexEscapes, getContextEscapes } from '../../index';
import { NodeType } from '../../ast/node';
import { StringE } from '../../extension/string';

type EscaperNodeType = 'text' | 'codeSpan';

interface EscaperDataType {
    type: EscaperNodeType;
}

export class Escaper {
    public escapes: RequiredProperty<LatexEscapeData>[];

    public constructor(escapes: RequiredProperty<LatexEscapeData>[]) {
        this.escapes = escapes;
    }

    public static fromContext(ctx: Context): Escaper {
        return new this(getConfigLatexEscapes(ctx.config.latex));
    }

    public static fromConfigLatex(
        config: RequiredProperty<LatexInfo>,
    ): Escaper {
        return new this(getConfigLatexEscapes(config));
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
