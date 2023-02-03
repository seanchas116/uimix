import { makeObservable, observable } from "mobx";
import { NodeData } from "node-data";
import { z } from "zod";
import { DocumentNode } from "./DocumentNode";
import { Node } from "./Node";

export const ProjectJSON = z.object({
  nodes: z.record(NodeData),
});
export type ProjectJSON = z.infer<typeof ProjectJSON>;

export class Project {
  constructor() {
    makeObservable(this);
  }

  @observable document = new DocumentNode();

  toJSON(): ProjectJSON {
    const nodes = this.document.children.flatMap((node) => node.serializeAll());

    return {
      nodes: Object.fromEntries(nodes.map((node) => [node.id, node])),
    };
  }

  clear() {
    for (const child of this.document.children) {
      child.remove();
    }
  }

  loadJSON(projectJSON: ProjectJSON) {
    this.clear();

    this.updateNodes(projectJSON.nodes);
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
