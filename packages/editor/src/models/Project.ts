import { makeObservable, observable } from "mobx";
import { NodeData } from "node-data";
import { z } from "zod";
import { CodeData, CodeSet } from "./Code";
import { DocumentNode } from "./DocumentNode";
import { Node } from "./Node";

export const ProjectJSON = z.object({
  nodes: z.record(NodeData),
  codes: z.record(CodeData),
});
export type ProjectJSON = z.infer<typeof ProjectJSON>;

export class Project {
  constructor() {
    makeObservable(this);
  }

  @observable document = new DocumentNode();
  readonly codes = new CodeSet();

  toJSON(): ProjectJSON {
    const nodes = this.document.children.flatMap((node) => node.serializeAll());
    const codes = [...this.codes.codes.values()].map((code) => ({
      id: code.id,
      target: code.target,
      content: code.content,
    }));

    return {
      nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
      codes: Object.fromEntries(codes.map((code) => [code.id, code])),
    };
  }

  clear() {
    for (const child of this.document.children) {
      child.remove();
    }
    this.codes.clear();
  }

  loadJSON(projectJSON: ProjectJSON) {
    this.clear();

    this.updateNodes(projectJSON.nodes);

    for (const [, codeJSON] of Object.entries(projectJSON.codes)) {
      const code = this.codes.create(codeJSON.id, codeJSON.target);
      code.content = codeJSON.content;
    }
  }

  updateNodes(nodes: Record<string, NodeData>) {
    const nodeInstances = new Map<string, Node>();

    for (const [, nodeJSON] of Object.entries(nodes)) {
      nodeInstances.set(
        nodeJSON.id,
        this.document.getOrCreateNode(nodeJSON.type, nodeJSON.id)
      );
    }

    for (const [, nodeJSON] of Object.entries(nodes)) {
      nodeInstances
        .get(nodeJSON.id)
        ?.deserializeAndReparent(nodeJSON, (parentID) => {
          const parent =
            this.document.getNodeForID(parentID) || nodeInstances.get(parentID);
          if (!parent) {
            console.warn("parent not found", parentID);
          }
          return parent;
        });
    }
  }

  deleteNodes(nodeIDs: string[]) {
    for (const nodeID of nodeIDs) {
      const node = this.document.getNodeForID(nodeID);
      node?.remove();
    }
  }

  private _duringRemoteUpdate = false;

  get duringRemoteUpdate(): boolean {
    return this._duringRemoteUpdate;
  }

  remoteUpdate(callback: () => void) {
    try {
      this._duringRemoteUpdate = true;
      callback();
    } finally {
      this._duringRemoteUpdate = false;
    }
  }
}
