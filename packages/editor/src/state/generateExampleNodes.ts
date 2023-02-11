import { Document } from "../models/Document";
import { Color } from "../utils/Color";
import colors from "tailwindcss/colors.js";

export function generateExampleNodes(document: Document) {
  for (let i = 0; i < 10; ++i) {
    const [frame] = document.root.append([
      { type: "frame", name: `Frame ${i}` },
    ]);
    const frameSelectable = document.getSelectable([frame.id]);
    const style = frameSelectable.style;
    style.position = {
      x: { type: "start", start: i * 100 + 50 },
      y: { type: "start", start: 90 },
    };
    style.width = { type: "fixed", value: 50 };
    style.height = { type: "fixed", value: 50 };
    style.fill = Color.from(colors.red[500])!.toHex();
  }

  {
    const [stack] = document.root.append([{ type: "frame", name: "Stack" }]);

    const stackStyle = document.getSelectable([stack.id]).style;

    stackStyle.position = {
      x: { type: "start", start: 50 },
      y: { type: "start", start: 200 },
    };
    stackStyle.width = { type: "hugContents" };
    stackStyle.height = { type: "hugContents" };
    stackStyle.fill = Color.white.toHex();
    stackStyle.layout = "stack";
    stackStyle.gap = 10;
    stackStyle.paddingTop = 10;
    stackStyle.paddingRight = 20;
    stackStyle.paddingBottom = 30;
    stackStyle.paddingLeft = 40;

    const [stackItem0] = stack.append([{ type: "frame", name: "Item 0" }]);
    const stackItem0Style = document.getSelectable([stackItem0.id]).style;

    stackItem0Style.width = { type: "fixed", value: 50 };
    stackItem0Style.height = { type: "fixed", value: 50 };
    stackItem0Style.fill = Color.from(colors.red[500])!.toHex();

    const [stackItem1] = stack.append([{ type: "frame", name: "Item 1" }]);
    const stackItem1Style = document.getSelectable([stackItem1.id]).style;

    stackItem1Style.width = { type: "fixed", value: 40 };
    stackItem1Style.height = { type: "fixed", value: 80 };
    stackItem1Style.fill = Color.from(colors.green[500])!.toHex();

    const [stackItem2] = stack.append([{ type: "frame", name: "Item 2" }]);
    const stackItem2Style = document.getSelectable([stackItem2.id]).style;

    stackItem2Style.width = { type: "fixed", value: 80 };
    stackItem2Style.height = { type: "fixed", value: 40 };
    stackItem2Style.fill = Color.from(colors.blue[500])!.toHex();

    const [text] = stack.prepend([{ type: "text", name: "Text" }]);
    const textStyle = document.getSelectable([text.id]).style;
    textStyle.textContent = "Hello, world!";
    textStyle.width = { type: "hugContents" };
    textStyle.height = { type: "hugContents" };
    textStyle.fontSize = 20;
    textStyle.fill = Color.from("black").toHex();
  }

  {
    const [componentNode] = document.root.append([
      { type: "component", name: "Button" },
    ]);

    // componentNode.props.replace([
    //   { name: "width", type: "number" },
    //   { name: "height", type: "number" },
    //   { name: "text", type: "string" },
    //   { name: "selected", type: "boolean" },
    // ]);

    const [rootNode] = componentNode.append([{ type: "frame" }]);

    const [textNode] = rootNode.append([{ type: "text", name: "Text" }]);
    const textNodeProps = document.getSelectable([textNode.id]).style;
    textNodeProps.textContent = "Button";

    const [hoverVariant] = componentNode.append([
      { type: "variant", name: "Hover" },
    ]);
    hoverVariant.condition = {
      type: "hover",
    };
    // TODO: condition
    // hoverVariant.condition = {
    //   type: "interaction",
    //   value: "hover",
    // };

    const [mobileVariant] = componentNode.append([
      { type: "variant", name: "Mobile" },
    ]);
    mobileVariant.condition = {
      type: "maxWidth",
      value: 767,
    };

    const rootNodeStyle = document.getSelectable([rootNode.id]).style;
    rootNodeStyle.position = {
      x: { type: "start", start: 50 },
      y: { type: "start", start: 400 },
    };
    rootNodeStyle.width = { type: "hugContents" };
    rootNodeStyle.height = { type: "hugContents" };
    rootNodeStyle.fill = Color.from(colors.gray[200])!.toHex();
    rootNodeStyle.layout = "stack";
    rootNodeStyle.paddingLeft = 8;
    rootNodeStyle.paddingRight = 8;
    rootNodeStyle.paddingTop = 4;
    rootNodeStyle.paddingBottom = 4;

    const textNodeStyle = document.getSelectable([textNode.id]).style;
    textNodeStyle.width = { type: "hugContents" };
    textNodeStyle.height = { type: "hugContents" };
    textNodeStyle.fill = Color.from(colors.gray[900])!.toHex();

    const hoverRootNodeStyle = document.getSelectable([hoverVariant.id]).style;
    hoverRootNodeStyle.position = {
      x: { type: "start", start: 150 },
      y: { type: "start", start: 400 },
    };
    hoverRootNodeStyle.fill = Color.from(colors.blue[500])!.toHex();

    const hoverTextNodeStyle = document.getSelectable([
      hoverVariant.id,
      textNode.id,
    ]).style;
    hoverTextNodeStyle.fill = Color.from(colors.white)!.toHex();

    const [instanceNode] = document.root.append([
      { type: "instance", name: "Instance" },
    ]);

    const instanceNodeStyle = document.getSelectable([instanceNode.id]).style;
    instanceNodeStyle.position = {
      x: { type: "start", start: 50 },
      y: { type: "start", start: 500 },
    };
    instanceNodeStyle.mainComponentID = componentNode.id;
  }

  // TODO: shape nodes
  // {
  //   const shapeNode = new ShapeNode();
  //   shapeNode.name = "Shape";
  //   shapeNode.path = Path.fromSVGPathData(
  //     "M8 5C8 5.55228 7.55228 6 7 6C6.44772 6 6 5.55228 6 5C6 4.44772 6.44772 4 7 4C7.55228 4 8 4.44772 8 5ZM8 7.82929C9.16519 7.41746 10 6.30622 10 5C10 3.34315 8.65685 2 7 2C5.34315 2 4 3.34315 4 5C4 6.30622 4.83481 7.41746 6 7.82929V16.1707C4.83481 16.5825 4 17.6938 4 19C4 20.6569 5.34315 22 7 22C8.65685 22 10 20.6569 10 19C10 17.6938 9.16519 16.5825 8 16.1707V14.8198L13.9806 13.6237C15.9303 13.2338 17.4242 11.741 17.866 9.87312C19.1006 9.5015 20 8.35578 20 7C20 5.34315 18.6569 4 17 4C15.3431 4 14 5.34315 14 7C14 8.23624 14.7478 9.29784 15.8157 9.75716C15.4633 10.7137 14.6354 11.4531 13.5883 11.6625L8 12.7802V7.82929ZM17 8C17.5523 8 18 7.55228 18 7C18 6.44772 17.5523 6 17 6C16.4477 6 16 6.44772 16 7C16 7.55228 16.4477 8 17 8ZM7 18C6.44772 18 6 18.4477 6 19C6 19.5523 6.44772 20 7 20C7.55228 20 8 19.5523 8 19C8 18.4477 7.55228 18 7 18Z"
  //   );
  //   shapeNode.viewBox = shapeNode.path.boundingBox();
  //   const shapeNodeStyle = Selectable.get(shapeNode).style;
  //   shapeNodeStyle.width = { type: "fixed", value: shapeNode.viewBox.width };
  //   shapeNodeStyle.height = {
  //     type: "fixed",
  //     value: shapeNode.viewBox.height,
  //   };
  //   shapeNodeStyle.position = {
  //     x: {
  //       type: "start",
  //       start: 400,
  //     },
  //     y: {
  //       type: "start",
  //       start: 400,
  //     },
  //   };
  //   shapeNodeStyle.fill = Color.from("gray");

  //   canvas.append([shapeNode]);
  // }

  // {
  //   const groupNode = new GroupNode();
  //   groupNode.name = "Group";

  //   for (let i = 0; i < 3; ++i) {
  //     const frame = new FrameNode();
  //     frame.name = `Frame ${i}`;

  //     const style = Selectable.get(frame).style;
  //     style.position = {
  //       x: {
  //         type: "start",
  //         start: i * 100 + 50,
  //       },
  //       y: {
  //         type: "start",
  //         start: 600,
  //       },
  //     };
  //     style.width = { type: "fixed", value: 50 };
  //     style.height = { type: "fixed", value: 50 };
  //     style.fill = Color.from("green");

  //     groupNode.append([frame]);
  //   }

  //   canvas.append([groupNode]);
  // }

  // {
  //   const pageNode = new ComponentNode();
  //   pageNode.name = "Page";

  //   pageNode.props.replace([
  //     { name: "width", type: "number" },
  //     { name: "height", type: "number" },
  //     { name: "text", type: "string" },
  //     { name: "selected", type: "boolean" },
  //   ]);

  //   const rootNode = new StackNode();
  //   pageNode.append([rootNode]);

  //   const rootNodeStyle = Selectable.get(rootNode).style;
  //   rootNodeStyle.position = {
  //     x: {
  //       type: "start",
  //       start: 50,
  //     },
  //     y: {
  //       type: "start",
  //       start: 700,
  //     },
  //   };
  //   rootNodeStyle.fill = Color.from("white");

  //   canvas.append([pageNode]);
  // }
}
