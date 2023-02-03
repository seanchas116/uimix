import { NodeData } from "./node/node";
import { FrameStyleData, StackStyleData, TextStyleData } from "./style/style";

const defaultStyle: FrameStyleData & StackStyleData & TextStyleData = {
  x: {
    type: "start",
    start: 0,
  },
  y: {
    type: "start",
    start: 0,
  },
  width: {
    type: "hugContents",
  },
  height: {
    type: "hugContents",
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

  stackDirection: "x",
  stackAlign: "start",
  stackJustify: "start",
  gap: 0,
  paddingTop: 0,
  paddingRight: 0,
  paddingBottom: 0,
  paddingLeft: 0,

  fontFamily: "Inter",
  fontWeight: 400,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  textHorizontalAlign: "start",
  textVerticalAlign: "start",
};

// node trees are serialized as JSON arrays
export const exampleNodes: NodeData[] = [
  {
    id: "component00",
    index: 0,
    type: "component",
    name: "Button",
    props: [
      {
        name: "text",
        type: "string",
        defaultValue: "Button",
      },
    ],
    variants: [
      {
        id: "hover00",
        condition: {
          type: "interaction",
          value: "hover",
        },
      },
    ],
  },
  {
    id: "button00",
    parent: "component00",
    index: 0,
    type: "stack",
    name: "",
    style: {
      ...defaultStyle,
      width: {
        type: "hugContents",
      },
      height: {
        type: "hugContents",
      },
      fill: "#2EDD1F",
      paddingLeft: 16,
      paddingRight: 16,
      paddingTop: 8,
      paddingBottom: 8,
      topLeftRadius: 4,
      topRightRadius: 4,
      bottomRightRadius: 4,
      bottomLeftRadius: 4,
    },
    styleForVariant: {
      hover00: {
        fill: "#5BFF4D",
      },
    },
  },
  {
    id: "text00",
    parent: "button00",
    index: 0,
    type: "text",
    name: "Text",
    content: "Button",
    style: {
      ...defaultStyle,
      width: {
        type: "hugContents",
      },
      height: {
        type: "hugContents",
      },
      fontSize: 16,
      fontWeight: 700,
      fill: "#FFFFFF",
    },
    styleForVariant: {},
  },
];
