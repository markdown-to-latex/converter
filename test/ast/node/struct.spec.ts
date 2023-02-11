// TODO: cover union of nodes
// TEXT_LIKE_NODES
// PARAGRAPH_LIKE_NODES
// into the test

// TODO: test that PARAGRAPH_LIKE_NODES = ALL_NODES - TEXT_LIKE_NODES


import { NodesArray } from "../../../src/ast";
import { PARAGRAPH_LIKE_NODES, SPECIAL_NODES, TEXT_LIKE_NODES } from "../../../src/ast/node";

describe("struct", function() {
    test("text-like + paragarph-like + special", function() {
        const nodesSet = new Set(NodesArray);

        const union = (() => {
            const a = new Set(TEXT_LIKE_NODES);
            for (let nodeType of PARAGRAPH_LIKE_NODES) {
                expect(
                    !a.has(nodeType),
                    `PARAGRAPH_LIKE_NODES and TEXT_LIKE_NODES overlap in ${nodeType}`
                ).toBeTruthy();
                a.add(nodeType);
            }
            for (let nodeType of SPECIAL_NODES) {
                expect(
                    !a.has(nodeType),
                    `SPECIAL_NODES and TEXT_LIKE_NODES overlap in ${nodeType}`
                ).toBeTruthy();
                a.add(nodeType);
            }

            return a;
        })();

        union.forEach(nodeType => {
            expect(nodesSet.has(nodeType)).toBeTruthy();
        });

        const notInUnion = Array.from(nodesSet).filter(n => !union.has(n));
        expect(notInUnion, `notInUnion: ${notInUnion.join(", ")}`).toHaveLength(0);
    });
});