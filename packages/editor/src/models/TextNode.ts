import { makeObservable, observable } from "mobx";
import { NodeData, PropReference, TextNodeData } from "node-data";
import { NodeBase } from "./NodeBase";
import { serializeTextStyle } from "./Style";

export class TextNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    makeObservable(this);
    this.watchPropChanges();
  }

  get type(): "text" {
    return "text";
  }

  get canHaveChildren(): boolean {
    return false;
  }

  @observable.ref content: string | PropReference = "Text";

  serialize(): TextNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeTextStyle(s)),
      type: "text",
      content: this.content,
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "text") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
    this.content = data.content;
  }
}
