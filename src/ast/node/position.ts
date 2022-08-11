export interface TextPosition {
    line: number;
    column: number;
}

export interface StartEndPosition<T> {
    start: T;
    end: T;
}

export type StartEndTextPosition = StartEndPosition<TextPosition>;

export function createStartEndTextPos(
    startLine: number,
    startCol: number,
    endLine: number,
    endCol: number,
): StartEndTextPosition {
    return {
        start: {
            line: startLine,
            column: startCol,
        },
        end: {
            line: endLine,
            column: endCol,
        },
    };
}

export function copyStartEndPos(
    pos: StartEndTextPosition,
): StartEndTextPosition {
    return {
        start: pos.start,
        end: pos.end,
    };
}

export function textPositionEq(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return left.line === right.line && left.column == right.column;
}

export function textPositionG(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return (
        left.line > right.line ||
        (left.line == right.line && left.column > right.column)
    );
}

export function textPositionGEq(
    left: TextPosition,
    right: TextPosition,
): boolean {
    return textPositionEq(left, right) || textPositionG(left, right);
}

export function copyTextPosition(pos: TextPosition): TextPosition {
    return { ...pos };
}

export interface LineWithPosition {
    str: string;
    pos: number;
}

export function splitLinesWithPositions(
    text: string,
    base: number = 0,
): LineWithPosition[] {
    const linesPositions: [string, number][] = [];
    text.split('\n').forEach((v, i) => {
        linesPositions.push([
            v,
            i === 0
                ? base
                : linesPositions[i - 1][1] +
                  linesPositions[i - 1][0].length +
                  1,
        ]);
    });

    return linesPositions.map(([v, pos]) => ({
        str: v.endsWith('\r') ? v.slice(0, v.length - 1) : v,
        pos,
    }));
}

export function linesToTextPosition(
    lines: LineWithPosition[],
    position: number,
): TextPosition {
    const index: number | null = (() => {
        for (let i = 0; i < lines.length; ++i) {
            const line = lines[i];
            if (
                line.pos <= position &&
                position <= line.pos + line.str.length
            ) {
                return i;
            }
            if (line.pos >= position) {
                return i;
            }
        }

        return null;
    })();

    if (index === null) {
        return {
            line: lines.length,
            column: lines[lines.length - 1].str.length + 1,
        };
    }

    return {
        // line and column starts from 1
        line: index + 1,
        column: position - lines[index].pos + 1,
    };
}

export function positionToTextPosition(
    text: string,
    position: number,
): TextPosition {
    const lines = splitLinesWithPositions(text);

    return linesToTextPosition(lines, position);
}
