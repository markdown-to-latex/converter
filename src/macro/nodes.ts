import * as nodes from '../macro/node/index';
import { ProcessedNodeType } from './node';

const ProcessedNodesByTypeMap = {
    [ProcessedNodeType.TableProcessed]: {} as nodes.TableProcessedNode,
    [ProcessedNodeType.PictureProcessed]: {} as nodes.PictureProcessedNode,
    [ProcessedNodeType.CodeProcessed]: {} as nodes.CodeProcessedNode,
    [ProcessedNodeType.PictureKey]: {} as nodes.PictureKeyNode,
    [ProcessedNodeType.TableKey]: {} as nodes.TableKeyNode,
    [ProcessedNodeType.ApplicationKey]: {} as nodes.ApplicationKeyNode,
    [ProcessedNodeType.ReferenceKey]: {} as nodes.ReferenceKeyNode,
    // [ProcessedNodeType.LatexSpecific]: {} as nodes.LatexSpecificNode,
    [ProcessedNodeType.AllApplications]: {} as nodes.AllApplicationsNode,
    [ProcessedNodeType.AllReferences]: {} as nodes.AllReferencesNode,
    [ProcessedNodeType.RawApplication]: {} as nodes.RawApplicationNode,
    [ProcessedNodeType.PictureApplication]: {} as nodes.PictureApplicationNode,
    [ProcessedNodeType.CodeApplication]: {} as nodes.CodeApplicationNode,
    [ProcessedNodeType.Reference]: {} as nodes.ReferenceNode,
} as const;

export type ProcessedNodesByType = typeof ProcessedNodesByTypeMap;

// Compile-time interface validation
const _ = ProcessedNodesByTypeMap as {
    [Key in ProcessedNodeType]: nodes.NodeProcessed;
};
