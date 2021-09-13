import { InlineLatexNode, NodeType, OpCodeNode, TextNode } from '../ast/nodes';

const regexpOpCode: RegExp = new RegExp(/!([A-Z0-9]+)\[([^\]]*)]\n?/g);

export function captureOpCodes(node: TextNode): void {
    const searchIterator = node.text.matchAll(regexpOpCode);
    let item = searchIterator.next();
    if (item.done) {
        return;
    }

    let endIndex = 0;
    while (!item.done) {
        const opcode = item.value[1];
        const args = item.value[2] !== '' ? item.value[2].split('|') : [];

        const contentEndIndex = item.value.index!;
        const newEndIndex = contentEndIndex + item.value[0].length;
        if (endIndex !== contentEndIndex) {
            const content = node.text.slice(endIndex, contentEndIndex);
            node.children.push({
                type: NodeType.Text,
                parent: node,
                text: content,
                children: [],
            } as TextNode);
        }

        node.children.push({
            type: NodeType.OpCode,
            parent: node,
            opcode: opcode,
            arguments: args,
        } as OpCodeNode);

        endIndex = newEndIndex;
        item = searchIterator.next();
    }

    if (endIndex < node.text.length) {
        const content = node.text.slice(endIndex);
        node.children.push({
            type: NodeType.Text,
            parent: node,
            text: content,
            children: [],
        } as TextNode);
    }
}

const latexInline: RegExp = new RegExp(/\$\$(.+?)\$\$/gs);

export function captureLatexInline(node: TextNode): void {
    const searchIterator = node.text.matchAll(latexInline);
    let item = searchIterator.next();
    if (item.done) {
        return;
    }

    let endIndex = 0;
    while (!item.done) {
        const inline = item.value[1];

        const contentEndIndex = item.value.index!;
        const newEndIndex = contentEndIndex + item.value[0].length;
        if (endIndex !== contentEndIndex) {
            const content = node.text.slice(endIndex, contentEndIndex);
            node.children.push({
                type: NodeType.Text,
                parent: node,
                text: content,
                children: [],
            } as TextNode);
        }

        node.children.push({
            type: NodeType.InlineLatex,
            parent: node,
            text: inline,
        } as InlineLatexNode);

        endIndex = newEndIndex;
        item = searchIterator.next();
    }

    if (endIndex < node.text.length) {
        const content = node.text.slice(endIndex);
        node.children.push({
            type: NodeType.Text,
            parent: node,
            text: content,
            children: [],
        } as TextNode);
    }
}
