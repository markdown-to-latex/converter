// import { start } from 'repl';
//
// export const enum RawLexemeType {
//     Raw = 'Raw',
// }
//
//
// export const enum LexemeType {
//     Space,
//     Paragraph,
//     Header,
//     Text,
//     Code,
// }
//
// const parserPriorities: LexemeType[] = [
//     LexemeType.Code,
//     LexemeType.Header,
//     LexemeType.Paragraph,
//     LexemeType.Text,
//     LexemeType.Space,
// ];
//
// interface TextPosition {
//     line: number;
//     column: number;
// }
//
// interface Node {
//     type: LexemeType | RawLexemeType,
//     parent?: Node,
//     children: [Node],
//     text: string,
//     pos: {
//         start: TextPosition,
//         end: TextPosition,
//     },
// }
//
// export function applyVisitors(node: Node) {
//     node.children;
// }
//
// type Visitor = (node: Node) => [Node];
// const parsers: {
//     [key in LexemeType]: Visitor
// } = {
//     [LexemeType.Code]: node => {
//         const lines = node.text.split(/\r?\n/);
//
//         const codeLexemes = lines
//             .map((v, i) => ({
//                 line: i,
//                 match: v.match(/\s*`{3,}/),
//             }))
//             .filter(v => v.match?.length)
//         ;
//
//         if (codeLexemes.length % 2 !== 0) {
//             let lastLexeme = codeLexemes[codeLexemes.length - 1];
//             let absLine = node.pos.start.line + lastLexeme.line;
//             throw new Error(
//                 `Unable to find closing quotes for block code. ` +
//                 `Began at ${absLine} at file TODO`,
//             );
//         }
//
//         for (let i = 0; i < codeLexemes.length; i += 2) {
//             let startLexeme = codeLexemes[i];
//             let endLexeme = codeLexemes[i + 1];
//
//             lines.slice(startLexeme.line + 1, endLexeme.line - 1).join('\n');
//         }
//     },
// };
//
//
//
//
