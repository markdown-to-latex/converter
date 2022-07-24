import { Printer } from '../struct';
import { ProcessingVisitors } from './visitors';
import {
    defaultEscapes,
    LatexPrinterConfigurationEscapeData,
} from './string/escapes';

/**
 * Information about LaTeX margins
 */
export interface LatexPrinterConfigurationMarginInfo {
    /**
     * Figure: Inner Text Separator
     */
    imageInnerTextSep: string;

    /**
     * Figure: Below Caption Skip
     */
    imageBelowCaptionSkip: string;

    /**
     * Figure: Removed Below Caption Skip
     */
    imageRemovedBelowCaptionSkip: string;

    /**
     * Figure: Above Caption Skip
     */
    imageAboveCaptionSkip: string;

    /**
     * Figure: Inner Text Separator
     */
    codeInnerTextSep: string;

    /**
     * Figure: Below Caption Skip
     */
    codeBelowCaptionSkip: string;

    /**
     * Figure: Removed Below Caption Skip
     */
    codeRemovedBelowCaptionSkip: string;

    /**
     * Figure: Above Caption Skip
     */
    codeAboveCaptionSkip: string;

    /**
     * LongTable: Below Caption Skip
     */
    tableBelowCaptionSkip: string;

    /**
     * LongTable: Above Caption Skip
     */
    tableAboveCaptionSkip: string;

    /**
     * LongTable: Pre
     */
    tablePre: string;

    /**
     * LongTable: Post
     */
    tablePost: string;

    /**
     * LongTable: Removed Post Space
     */
    tableRemovedPost: string;

    /**
     * Code: Above Display Skip
     */
    mathAboveDisplaySkip: string;

    /**
     * Code: Below Display Skip
     */
    mathBelowDisplaySkip: string;

    /**
     * Code: Above Display Short Skip
     */
    mathAboveDisplayShortSkip: string;

    /**
     * Code: Below Display Short Skip
     */
    mathBelowDisplayShortSkip: string;
}

export type LatexInterpretation =
    | 'monospace'
    | 'bold'
    | 'underline'
    | 'italic'
    | 'quotes';

export interface LatexPrinterConfiguration {
    defaultAutoEscapes: boolean;
    extendAutoEscapes: LatexPrinterConfigurationEscapeData[];

    useLinkAs: LatexInterpretation;
    useCodeSpanAs: LatexInterpretation;

    margin: LatexPrinterConfigurationMarginInfo;
}

export interface LatexPrinterConfigurationEscapeDataPartial
    extends Partial<LatexPrinterConfigurationEscapeData> {
    chars: [string, ...string[]];
}

export interface LatexPrinterConfigurationPartial
    extends Omit<
        Partial<LatexPrinterConfiguration>,
        'extendAutoEscapes' | 'margin'
    > {
    extendAutoEscapes?: LatexPrinterConfigurationEscapeDataPartial[];
    margin?: Partial<LatexPrinterConfigurationMarginInfo>;
}

const defaultConfig: LatexPrinterConfiguration = {
    useCodeSpanAs: 'quotes',
    useLinkAs: 'underline',
    extendAutoEscapes: [],
    defaultAutoEscapes: true,
    margin: {
        imageInnerTextSep: '3em',
        imageBelowCaptionSkip: '-4ex',
        imageRemovedBelowCaptionSkip: '-1.6em',
        imageAboveCaptionSkip: '0.5em',
        codeInnerTextSep: '3em',
        codeBelowCaptionSkip: '-4ex',
        codeRemovedBelowCaptionSkip: '-1.6em',
        codeAboveCaptionSkip: '-0.5em',
        tableBelowCaptionSkip: '0em',
        tableAboveCaptionSkip: '0em',
        tablePre: '2em',
        tablePost: '2em',
        tableRemovedPost: '0em',
        mathAboveDisplaySkip: '-0.9em',
        mathBelowDisplaySkip: '0pt',
        mathAboveDisplayShortSkip: '0pt',
        mathBelowDisplayShortSkip: '0pt',
    },
};

const defaultEscapeDataConfig: LatexPrinterConfigurationEscapeData = {
    chars: [''],
    inCodeSpan: true,
    inLink: true,
    inText: true,
    replacer: '\\$1',
};

export function buildConfig(
    config?: LatexPrinterConfigurationPartial,
): LatexPrinterConfiguration {
    return {
        useCodeSpanAs: config?.useCodeSpanAs ?? defaultConfig.useCodeSpanAs,
        useLinkAs: config?.useLinkAs ?? defaultConfig.useLinkAs,
        defaultAutoEscapes: config?.defaultAutoEscapes ?? true,
        extendAutoEscapes:
            config?.extendAutoEscapes?.map(data => ({
                chars: data.chars,
                inCodeSpan:
                    data.inCodeSpan ?? defaultEscapeDataConfig.inCodeSpan,
                inLink: data.inLink ?? defaultEscapeDataConfig.inLink,
                inText: data.inText ?? defaultEscapeDataConfig.inText,
                replacer: data.replacer ?? defaultEscapeDataConfig.replacer,
            })) ?? [],
        margin: {
            imageInnerTextSep:
                config?.margin?.imageInnerTextSep ??
                defaultConfig.margin.imageInnerTextSep,
            imageBelowCaptionSkip:
                config?.margin?.imageBelowCaptionSkip ??
                defaultConfig.margin.imageBelowCaptionSkip,
            imageRemovedBelowCaptionSkip:
                config?.margin?.imageRemovedBelowCaptionSkip ??
                defaultConfig.margin.imageRemovedBelowCaptionSkip,
            imageAboveCaptionSkip:
                config?.margin?.imageAboveCaptionSkip ??
                defaultConfig.margin.imageAboveCaptionSkip,
            codeInnerTextSep:
                config?.margin?.codeInnerTextSep ??
                defaultConfig.margin.codeInnerTextSep,
            codeBelowCaptionSkip:
                config?.margin?.codeBelowCaptionSkip ??
                defaultConfig.margin.codeBelowCaptionSkip,
            codeRemovedBelowCaptionSkip:
                config?.margin?.codeRemovedBelowCaptionSkip ??
                defaultConfig.margin.codeRemovedBelowCaptionSkip,
            codeAboveCaptionSkip:
                config?.margin?.codeAboveCaptionSkip ??
                defaultConfig.margin.codeAboveCaptionSkip,
            tableBelowCaptionSkip:
                config?.margin?.tableBelowCaptionSkip ??
                defaultConfig.margin.tableBelowCaptionSkip,
            tableAboveCaptionSkip:
                config?.margin?.tableAboveCaptionSkip ??
                defaultConfig.margin.tableAboveCaptionSkip,
            tablePre: config?.margin?.tablePre ?? defaultConfig.margin.tablePre,
            tablePost:
                config?.margin?.tablePost ?? defaultConfig.margin.tablePost,
            tableRemovedPost:
                config?.margin?.tableRemovedPost ??
                defaultConfig.margin.tableRemovedPost,
            mathAboveDisplaySkip:
                config?.margin?.mathAboveDisplaySkip ??
                defaultConfig.margin.mathAboveDisplaySkip,
            mathBelowDisplaySkip:
                config?.margin?.mathBelowDisplaySkip ??
                defaultConfig.margin.mathBelowDisplaySkip,
            mathAboveDisplayShortSkip:
                config?.margin?.mathAboveDisplayShortSkip ??
                defaultConfig.margin.mathAboveDisplayShortSkip,
            mathBelowDisplayShortSkip:
                config?.margin?.mathBelowDisplayShortSkip ??
                defaultConfig.margin.mathBelowDisplayShortSkip,
        },
    };
}

export function getConfigEscapes(
    config: LatexPrinterConfiguration,
): LatexPrinterConfigurationEscapeData[] {
    return [
        config.defaultAutoEscapes ? defaultEscapes : [],
        config.extendAutoEscapes,
    ].flatMap(n => n);
}
