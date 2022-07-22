import {rawNodeTemplate} from "../ast/parsing/lexer/utils";
import {applyVisitors} from "../../src/ast/parsing/lexer";
import {FileNode, ParagraphNode} from "../../src/ast/node";
import {applyMacros} from "../../src/macro";

describe('macros', () => {
    test('table', () => {
        const rawNode = rawNodeTemplate(`
!TK[table-label]

!T[table-label](a table)

|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes } = applyVisitors([rawNode]);
        (rawNode.parent as FileNode).children = nodes;

        const diagnostic = applyMacros(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0)
        // TODO: not working, needs in-depth traverse
        expect(nodes).toMatchSnapshot();
    })
});