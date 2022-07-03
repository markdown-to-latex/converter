import { EscaperReady } from '../printer/latex/escaper';
import { Context } from '../printer/context';
import { LatexString } from '../printer/latex';
import { TextPosition } from '../ast/node';

export class StringE {
    /**
     * Anti-Replacement mapping
     *
     * [md-to-latex specific]
     * @see https://github.com/markedjs/marked/blob/288f1cbe2f55881972c0f594ddb9910888986bee/src/helpers.js#L8
     * @protected
     */
    protected static _escapeDeReplacements: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': '\'',
    };
    protected _string: string;

    constructor(string: string | StringE) {
        if (typeof string === 'string') {
            this._string = string;
            return;
        }

        this._string = string._string;
    }

    /**
     * [default method field proxy]
     * @see String.toLowerCase
     */
    public get lowerCase(): StringE {
        return this.toLowerCaseE();
    }

    /**
     * [default method field proxy]
     * @see String.toUpperCase
     */
    public get upperCase(): StringE {
        return this.toUpperCaseE();
    }

    /**
     * [default method field proxy]
     * @see String.trim
     */
    public get trimmed(): StringE {
        return this.trimE();
    }

    /**
     * [default method field proxy]
     * @see String.length
     */
    public get length(): number {
        return this._string.length;
    }

    /**
     * Get string value
     *
     * [md-to-latex specific]
     */
    public get s(): string {
        return this._string;
    }

    /**
     * Safe constructor
     *
     * @param string
     */
    public static from(string: string | StringE): StringE {
        return new StringE(string);
    }

    /**
     * [default method proxy]
     * @see String.charAt
     */
    public charAtE(pos: number): StringE {
        return new StringE(this._string.charAt(pos));
    }

    /**
     * [default method proxy]
     * @see String.concat
     */
    public concatE(...strings: Array<StringE | string>): StringE {
        return new StringE(this._string.concat(...(strings as string[])));
    }

    /**
     * [default method proxy]
     * @see String.replace
     */
    public replaceE(
        searchValue: string | StringE | RegExp,
        replaceValue: string | StringE,
    ): StringE {
        return new StringE(
            this._string.replace(searchValue as string, replaceValue as string),
        );
    }

    /**
     * [default method proxy]
     * @see String.slice
     */
    public sliceE(start?: number, end?: number): StringE {
        return new StringE(this._string.slice(start, end));
    }

    /**
     * [default method proxy]
     * @see String.split
     */
    public splitE(separator: string | RegExp, limit?: number): StringE[] {
        return this._string.split(separator, limit).map(d => new StringE(d));
    }

    /**
     * [default method proxy]
     * @see String.substring
     */
    public substringE(start: number, end?: number): StringE {
        return new StringE(this._string.substring(start, end));
    }

    /**
     * [default method proxy]
     * @see String.toLowerCase
     */
    public toLowerCaseE(): StringE {
        return new StringE(this._string.toLowerCase());
    }

    /**
     * [default method proxy]
     * @see String.toLocaleLowerCase
     */
    public toLocaleLowerCaseE(locales?: string | string[]): StringE {
        return new StringE(this._string.toLocaleLowerCase(locales));
    }

    /**
     * [default method proxy]
     * @see String.toUpperCase
     */
    public toUpperCaseE(): StringE {
        return new StringE(this._string.toUpperCase());
    }

    /**
     * [default method proxy]
     * @see String.toLocaleUpperCase
     */
    public toLocaleUpperCaseE(locales?: string | string[]): StringE {
        return new StringE(this._string.toLocaleUpperCase(locales));
    }

    /**
     * [default method proxy]
     * @see String.trim
     */
    public trimE(): StringE {
        return new StringE(this._string.trim());
    }

    /**
     * [default method proxy]
     * @see String.valueOf
     */
    public valueOfE(): StringE {
        return new StringE(this._string.valueOf());
    }

    /**
     * [default method proxy]
     * @see String.normalize
     */
    public normalizeE(form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): StringE {
        return new StringE(this._string.normalize(form));
    }

    /**
     * [default method proxy]
     * @see String.repeat
     */
    public repeatE(count: number): StringE {
        return new StringE(this._string.repeat(count));
    }

    /**
     * Remove replacements made by `marked`
     *
     * [md-to-latex specific]
     * @see https://github.com/markedjs/marked/blob/288f1cbe2f55881972c0f594ddb9910888986bee/src/helpers.js#L8
     */
    public resolveDeReplacements(): StringE {
        let text: StringE = this;
        for (const dereplacement of Object.keys(
            StringE._escapeDeReplacements,
        )) {
            const regexp = new RegExp(dereplacement, 'g');
            text = text.replaceE(
                regexp,
                StringE._escapeDeReplacements[dereplacement],
            );
        }

        return text;
    }

    /**
     * Convert to RegExp
     *
     * - d --  Generate indices for substring matches.
     * - g --  Global search.
     * - i --  Case-insensitive search.
     * - m --  Multi-line search.
     * - s --  Allows . to match newline characters.
     * - u --  "unicode"; treat a pattern as a sequence of unicode code points.
     * - y --  Perform a "sticky" search that matches starting at the current position in the target string. See sticky.
     *
     * [md-to-latex specific]
     * @param flags RegExp Flags
     */
    public toRegExp(flags?: Parameters<RegExpConstructor>[1]): RegExp {
        return new RegExp(this.s, flags);
    }

    /**
     * Apply EscaperReady class for the string.
     * Is being used for escaping some characters
     *
     * [md-to-latex specific]
     */
    public applyEscaper(escaper: EscaperReady): StringE {
        return escaper.apply(this);
    }

    public removeUnnecessaryLineBreaks(): StringE {
        return this.replaceE(/\n{3,}/g, '\n\n')
            .replaceE(/^\n+/g, '')
            .replaceE(/\n{2,}$/g, '\n');
    }

    public toLatexString(context: Context): LatexString {
        return new LatexString(this, context);
    }

    private __linesRegexp: RegExp = new RegExp(/\r?\n/g);

    public get lines(): StringE[] {
        return this.splitE(this.__linesRegexp);
    }

    public slicePosition(
        basePos: Readonly<TextPosition>,
        startPos: Readonly<TextPosition>,
        endPos: Readonly<TextPosition>,
    ): StringE {
        const startPosOffset: TextPosition = {
            line: startPos.line - basePos.line,
            column: startPos.column,
        };
        const endPosOffset: TextPosition = {
            line: endPos.line - basePos.line,
            column: endPos.column,
        };

        // TODO: cache lines
        const lines = this.lines.slice(startPosOffset.line, endPosOffset.line);
        if (lines.length === 0) {
            return StringE.from('');
        }
        if (startPosOffset.line === endPosOffset.line) {
            return lines[0].sliceE(startPosOffset.column, endPosOffset.column);
        }

        lines[0] = lines[0].sliceE(startPosOffset.column);
        lines[lines.length - 1] = lines[lines.length - 1].sliceE(
            0,
            endPosOffset.column,
        );

        return StringE.from(lines.map(s => s.s).join('\n'));
    }
}
