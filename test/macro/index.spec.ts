import {rawNodeTemplate} from "../ast/parsing/lexer/utils";
import {applyVisitors} from "../../src/ast/parsing/lexer";
import {FileNode, ParagraphNode} from "../../src/ast/node";
import {applyMacros} from "../../src/macro";

describe('macros', () => {
    test('table', () => {
        const rawNode = rawNodeTemplate(`
!TK[table-label]
        
!T[table-label]

|asda|asdasd|
|----|------|
|asda|asdasd|

`);
        const { nodes } = applyVisitors([rawNode]);

        const diagnostic = applyMacros(rawNode.parent as FileNode);
        expect(diagnostic).toHaveLength(0)
        // TODO: not working, needs in-depth traverse
        expect(nodes).toMatchSnapshot();
    })
});