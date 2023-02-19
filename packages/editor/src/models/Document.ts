import { DocumentJSON, NodeJSON } from "@uimix/node-data";
import * as Y from "yjs";
import { getOrCreate } from "../state/Collection";
import { generateID } from "../utils/ID";
import { ObservableYMap } from "../utils/ObservableYMap";
import { Node } from "./Node";
import { Project } from "./Project";
import { Selectable } from "./Selectable";
import { IStyle } from "./Style";

export class Document {
  constructor(project: Project, filePath: string, data: Y.Map<any>) {
    this.project = project;
    this.filePath = filePath;
    this.data = ObservableYMap.get(data);

    const rootData = getOrCreate(data, "root", () => new Y.Map()) as Y.Map<any>;
    if (!rootData.has("id")) {
      rootData.set("id", generateID());
      rootData.set("type", "root");
      rootData.set("children", new Y.Array());
    }

    this.root = new Node(this, undefined, rootData);
    this.project.nodes.add(this.root);
  }

  readonly project: Project;
  readonly filePath: string;
  readonly data: ObservableYMap<any>;
  readonly root: Node;

  get rootSelectable(): Selectable {
    return this.project.selectables.get([this.root.id]);
  }

  toJSON(): DocumentJSON {
    return toDocumentJSON(this.rootSelectable.children);
  }

  loadJSON(json: DocumentJSON) {
    this.root.clear();
    this.root.append(json.nodes);
    for (const [id, style] of Object.entries(json.styles)) {
      const selectable = this.project.selectables.get(id.split(":"));
      selectable.selfStyle.loadJSON(style);
    }
  }
}

// TODO generate correctly from instance contents
export function toDocumentJSON(selectables: Selectable[]): DocumentJSON {
  const nodeJSONs: NodeJSON[] = [];
  const styles: Record<string, Partial<IStyle>> = {};

  const addStyleRecursively = (selectable: Selectable) => {
    styles[selectable.id] = selectable.selfStyle.toJSON();
    for (const child of selectable.children) {
      addStyleRecursively(child);
    }
  };

  for (const selected of selectables) {
    nodeJSONs.push(selected.originalNode.toJSON());
    addStyleRecursively(selected);
  }

  return {
    nodes: nodeJSONs,
    styles,
  };
}
