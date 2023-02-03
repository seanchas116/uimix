import { isEqual } from "lodash-es";
import { makeObservable, observable } from "mobx";
import {
  AllStyleData,
  CommonStyleMixin,
  FrameStyleData,
  PositionConstraint,
  SizeConstraint,
  StackAlign,
  StackDirection,
  StackJustify,
  StackStyleData,
  TextHorizontalAlign,
  TextStyleData,
  TextVerticalAlign,
} from "node-data";
import { Color } from "../utils/Color";
import { ObservableChangeWatcher } from "../utils/ObservableChangeWatcher";

export interface IStyle {
  position: {
    readonly x: PositionConstraint;
    readonly y: PositionConstraint;
  };
  width: SizeConstraint;
  height: SizeConstraint;

  topLeftRadius: number;
  topRightRadius: number;
  bottomRightRadius: number;
  bottomLeftRadius: number;

  fill: Color | null;
  border: Color | null;
  borderTopWidth: number;
  borderRightWidth: number;
  borderBottomWidth: number;
  borderLeftWidth: number;

  // stack (auto layout)

  stackDirection: StackDirection;
  stackAlign: StackAlign;
  stackJustify: StackJustify;
  gap: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;

  // text

  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textHorizontalAlign: TextHorizontalAlign;
  textVerticalAlign: TextVerticalAlign;
}

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

  stackDirection: "x",
  stackAlign: "start",
  stackJustify: "start",
  gap: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,

  // text

  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  textHorizontalAlign: "start",
  textVerticalAlign: "start",
};

export class PartialStyle implements Partial<IStyle> {
  constructor({
    onWillChange,
    onDidChange,
  }: {
    onWillChange: () => void;
    onDidChange: () => void;
  }) {
    makeObservable(this);
    new ObservableChangeWatcher(this, onWillChange, onDidChange);
  }

  @observable.ref position:
    | { x: PositionConstraint; y: PositionConstraint }
    | undefined = undefined;
  @observable.ref width: SizeConstraint | undefined = undefined;
  @observable.ref height: SizeConstraint | undefined = undefined;

  @observable topLeftRadius: number | undefined = undefined;
  @observable topRightRadius: number | undefined = undefined;
  @observable bottomRightRadius: number | undefined = undefined;
  @observable bottomLeftRadius: number | undefined = undefined;

  @observable fill: Color | null | undefined = undefined;
  @observable border: Color | null | undefined = undefined;
  @observable borderTopWidth: number | undefined = undefined;
  @observable borderRightWidth: number | undefined = undefined;
  @observable borderBottomWidth: number | undefined = undefined;
  @observable borderLeftWidth: number | undefined = undefined;

  // stack (auto layout)

  @observable stackDirection: StackDirection | undefined = undefined;
  @observable stackAlign: StackAlign | undefined = undefined;
  @observable stackJustify: StackJustify | undefined = undefined;
  @observable gap: number | undefined = undefined;
  @observable paddingTop: number | undefined = undefined;
  @observable paddingRight: number | undefined = undefined;
  @observable paddingBottom: number | undefined = undefined;
  @observable paddingLeft: number | undefined = undefined;

  // text

  @observable fontFamily: string | undefined = undefined;
  @observable fontWeight: number | undefined = undefined;
  @observable fontSize: number | undefined = undefined;
  @observable lineHeight: number | undefined = undefined;
  @observable letterSpacing: number | undefined = undefined;
  @observable textHorizontalAlign: TextHorizontalAlign | undefined = undefined;
  @observable textVerticalAlign: TextVerticalAlign | undefined = undefined;
}

export function createCascadedStyle(
  style: PartialStyle,
  parent: IStyle
): IStyle {
  const cascaded = {};

  for (const key of Object.keys(defaultStyle) as (keyof IStyle)[]) {
    Object.defineProperty(cascaded, key, {
      get: () => {
        if (style[key] !== undefined) {
          return style[key];
        }
        return parent[key];
      },
      set: (value) => {
        if (isEqual(value, parent[key])) {
          style[key] = undefined;
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          style[key] = value;
        }
      },
    });
  }

  return cascaded as IStyle;
}

export function serializeCommonStyle(style: IStyle): CommonStyleMixin;
export function serializeCommonStyle(
  style: Partial<IStyle>
): Partial<CommonStyleMixin>;
export function serializeCommonStyle(
  style: Partial<IStyle>
): Partial<CommonStyleMixin> {
  return {
    x: style.position?.x,
    y: style.position?.y,
    width: style.width,
    height: style.height,

    fill: style.fill ? style.fill.toHex() : style.fill,
    border: style.border ? style.border.toHex() : style.border,
    borderTopWidth: style.borderTopWidth,
    borderRightWidth: style.borderRightWidth,
    borderBottomWidth: style.borderBottomWidth,
    borderLeftWidth: style.borderLeftWidth,
  };
}

export function serializeFrameStyle(style: IStyle): FrameStyleData;
export function serializeFrameStyle(
  style: Partial<IStyle>
): Partial<FrameStyleData>;
export function serializeFrameStyle(
  style: Partial<IStyle>
): Partial<FrameStyleData> {
  return {
    ...serializeCommonStyle(style),
    topLeftRadius: style.topLeftRadius,
    topRightRadius: style.topRightRadius,
    bottomRightRadius: style.bottomRightRadius,
    bottomLeftRadius: style.bottomLeftRadius,
  };
}

export function serializeStackStyle(style: IStyle): StackStyleData;
export function serializeStackStyle(
  style: Partial<IStyle>
): Partial<StackStyleData>;
export function serializeStackStyle(
  style: Partial<IStyle>
): Partial<StackStyleData> {
  return {
    ...serializeFrameStyle(style),

    stackDirection: style.stackDirection,
    stackAlign: style.stackAlign,
    stackJustify: style.stackJustify,
    gap: style.gap,
    paddingTop: style.paddingTop,
    paddingRight: style.paddingRight,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
  };
}

export function serializeTextStyle(style: IStyle): TextStyleData;
export function serializeTextStyle(
  style: Partial<IStyle>
): Partial<TextStyleData>;
export function serializeTextStyle(
  style: Partial<IStyle>
): Partial<TextStyleData> {
  return {
    ...serializeCommonStyle(style),

    fontFamily: style.fontFamily,
    fontWeight: style.fontWeight,
    fontSize: style.fontSize,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textHorizontalAlign: style.textHorizontalAlign,
    textVerticalAlign: style.textVerticalAlign,
  };
}

export function serializeAllStyle(
  style: Partial<IStyle>
): Partial<AllStyleData> {
  return {
    ...serializeFrameStyle(style),
    ...serializeStackStyle(style),
    ...serializeTextStyle(style),
  };
}

export function deserializeStyle(
  style: PartialStyle,
  data: Partial<AllStyleData>
) {
  style.position = data.x && data.y && { x: data.x, y: data.y };
  style.width = data.width;
  style.height = data.height;

  style.fill = data.fill != null ? Color.from(data.fill) : data.fill;
  style.border = data.border != null ? Color.from(data.border) : data.border;
  style.borderTopWidth = data.borderTopWidth;
  style.borderRightWidth = data.borderRightWidth;
  style.borderBottomWidth = data.borderBottomWidth;
  style.borderLeftWidth = data.borderLeftWidth;

  style.topLeftRadius = data.topLeftRadius;
  style.topRightRadius = data.topRightRadius;
  style.bottomRightRadius = data.bottomRightRadius;
  style.bottomLeftRadius = data.bottomLeftRadius;

  style.stackDirection = data.stackDirection;
  style.stackAlign = data.stackAlign;
  style.stackJustify = data.stackJustify;
  style.gap = data.gap;
  style.paddingTop = data.paddingTop;
  style.paddingRight = data.paddingRight;
  style.paddingBottom = data.paddingBottom;
  style.paddingLeft = data.paddingLeft;

  style.fontFamily = data.fontFamily;
  style.fontWeight = data.fontWeight;
  style.fontSize = data.fontSize;
  style.lineHeight = data.lineHeight;
  style.letterSpacing = data.letterSpacing;
  style.textHorizontalAlign = data.textHorizontalAlign;
  style.textVerticalAlign = data.textVerticalAlign;
}
