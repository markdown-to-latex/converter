class StringEscapeFactory {

}

class StringE extends String {
    charAtE(pos: number): StringE {
        return new StringE(super.charAt(pos));
    }

    concatE(...strings: Array<StringE | string>): StringE {
        return new StringE(super.concat(...(strings as string[])));
    }

    replaceE(
        searchValue: string | StringE | RegExp,
        replaceValue: string | StringE,
    ): StringE {
        return new StringE(
            super.replace(searchValue as string, replaceValue as string),
        );
    }

    sliceE(start?: number, end?: number): StringE {
        return new StringE(super.slice(start, end));
    }

    splitE(separator: string | RegExp, limit?: number): StringE[] {
        return super.split(separator, limit).map(d => new StringE(d));
    }

    substringE(start: number, end?: number): StringE {
        return new StringE(super.substring(start, end));
    }

    toLowerCaseE(): StringE {
        return new StringE(super.toLowerCase());
    }

    toLocaleLowerCaseE(locales?: string | string[]): StringE {
        return new StringE(super.toLocaleLowerCase(locales));
    }

    toUpperCaseE(): StringE {
        return new StringE(super.toUpperCase());
    }

    toLocaleUpperCaseE(locales?: string | string[]): StringE {
        return new StringE(super.toLocaleUpperCase(locales));
    }

    trimE(): StringE {
        return new StringE(super.trim());
    }

    valueOfE(): StringE {
        return new StringE(super.valueOf());
    }

    normalizeE(form: 'NFC' | 'NFD' | 'NFKC' | 'NFKD'): StringE {
        return new StringE(super.normalize(form));
    }

    repeatE(count: number): StringE {
        return new StringE(super.repeat(count));
    }

    protected _escapeDeReplacements: Record<string, string> = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
    };

    /**
     * See https://github.com/markedjs/marked/blob/288f1cbe2f55881972c0f594ddb9910888986bee/src/helpers.js#L8
     */
    public resolveDeReplacements(): StringE {
        let text: StringE = this;
        for (const dereplacement of Object.keys(this._escapeDeReplacements)) {
            const regexp = new RegExp(dereplacement, 'g');
            text = text.replaceE(
                regexp,
                this._escapeDeReplacements[dereplacement],
            );
        }

        return text;
    }
}
