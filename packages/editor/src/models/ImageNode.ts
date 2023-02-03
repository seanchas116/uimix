import { makeObservable, observable } from "mobx";
import { ImageNodeData, ImageSource, NodeData } from "node-data";
import { NodeBase } from "./NodeBase";
import { serializeCommonStyle } from "./Style";
import { cloneDeep } from "lodash-es";

// 1x1 PNG filled with rgba(255, 0, 0, 0.5)
export const emptyPNGDataURL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

export class ImageNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    makeObservable(this);
    this.watchPropChanges();
  }

  get type(): "image" {
    return "image";
  }

  get canHaveChildren(): boolean {
    return false;
  }

  @observable.ref source: ImageSource = {
    dataURL: emptyPNGDataURL,
    width: 1,
    height: 1,
  };

  serialize(): ImageNodeData {
    return {
      ...this.serializeCommonWithStyle((s) => serializeCommonStyle(s)),
      type: "image",
      source: cloneDeep(this.source),
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "image") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);
    this.source = cloneDeep(data.source);
  }
}
