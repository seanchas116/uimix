import { isEqual } from "lodash-es";
import { StyleJSON } from "@uimix/node-data";
import { ObservableYMap } from "../utils/ObservableYMap";
import * as Y from "yjs";

export type IStyle = StyleJSON;

export const defaultStyle: IStyle = {
  position: {
    x: {
      type: "start",
      start: 0,
    },
    y: {
      type: "start",
      start: 0,
    },
  },
  absolute: false,
  width: {
    type: "fixed",
    value: 0,
  },
  height: {
    type: "fixed",
    value: 0,
  },

  topLeftRadius: 0,
  topRightRadius: 0,
  bottomRightRadius: 0,
  bottomLeftRadius: 0,

  fill: null,
  border: null,
  borderTopWidth: 0,
  borderRightWidth: 0,
  borderBottomWidth: 0,
  borderLeftWidth: 0,

  // stack (auto layout)

  layout: "none",
  stackDirection: "x",
  stackAlign: "start",
  stackJustify: "start",
  gap: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,

  // text

  textContent: "",
  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  textHorizontalAlign: "start",
  textVerticalAlign: "start",

  // instance
  mainComponentID: null,
};

export class PartialStyle implements Partial<IStyle> {
  constructor(data: Y.Map<any>) {
    this.data = ObservableYMap.get(data);
  }
  data: ObservableYMap<any>;

  toJSON() {
    return this.data.toJSON();
  }
  loadJSON(json: Partial<IStyle>) {
    this.data.clear();
    for (const [key, value] of Object.entries(json)) {
      this.data.set(key, value);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface PartialStyle extends Partial<IStyle> {}

for (const key of Object.keys(defaultStyle)) {
  Object.defineProperty(PartialStyle.prototype, key, {
    get: function (this: PartialStyle) {
      return this.data.get(key);
    },
    set(this: PartialStyle, value) {
      if (value === undefined) {
        this.data.delete(key);
      } else {
        this.data.set(key, value);
      }
    },
  });
}

export class CascadedStyle implements IStyle {
  constructor(style: PartialStyle, parent: IStyle) {
    this.style = style;
    this.parent = parent;
  }
  style: PartialStyle;
  parent: IStyle;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CascadedStyle extends IStyle {}

for (const key of Object.keys(defaultStyle) as (keyof IStyle)[]) {
  Object.defineProperty(CascadedStyle.prototype, key, {
    get(this: CascadedStyle) {
      if (this.style[key] !== undefined) {
        return this.style[key];
      }
      return this.parent[key];
    },
    set(this: CascadedStyle, value) {
      if (isEqual(value, this.parent[key])) {
        this.style[key] = undefined;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        this.style[key] = value;
      }
    },
  });
}
