import { FrameNodeData, NodeData } from "node-data";
import { NodeBase } from "./NodeBase";
import { serializeFrameStyle } from "./Style";

export class FrameNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();
  }

  get type(): "frame" {
    return "frame";
  }

  get canHaveChildren(): boolean {
    return true;
  }

  serialize(): FrameNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeFrameStyle(s)),
      type: "frame",
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "frame") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
  }
}
