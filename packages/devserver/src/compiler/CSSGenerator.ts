import { StackDirection } from "@uimix/node-data";
import { Component, Node, Project, buildNodeCSS } from "@uimix/render";

export class CSSGenerator {
  constructor(project: Project, imageURLs: Map<string, string>) {
    this.project = project;
    this.images = imageURLs;
  }

  project: Project;
  images: Map<string, string>;

  generateCSS(): CSSRule[] {
    const rules: CSSRule[] = [];
    for (const componentRenderer of this.project.components.values()) {
      rules.push(
        ...new ComponentCSSGenerator(
          componentRenderer,
          this.images
        ).generateCSS([])
      );
    }
    return rules;
  }
}

class ComponentCSSGenerator {
  constructor(component: Component, imageURLs: Map<string, string>) {
    this.project = component.project;
    this.component = component;
    this.imageURLs = imageURLs;
  }

  project: Project;
  component: Component;
  imageURLs: Map<string, string>;

  generateCSS(
    instancePath: string[],
    parentStackDirection?: StackDirection
  ): CSSRule[] {
    return this.generateNodeCSS(
      this.component.rootNode,
      instancePath,
      parentStackDirection
    );
  }

  generateNodeCSS(
    node: Node,
    instancePath: string[],
    parentStackDirection?: StackDirection
  ): CSSRule[] {
    const isRoot = node === this.component.rootNode;

    const isInstanceRoot = isRoot && instancePath.length;
    const isComponentRoot = isRoot && !instancePath.length;

    const idPath = isInstanceRoot ? instancePath : [...instancePath, node.id];
    const style = this.project.getStyle(idPath);

    const stackDirection =
      node.type === "frame" && style.layout === "stack"
        ? style.stackDirection
        : undefined;

    if (node.type === "instance") {
      const mainComponentID = style.mainComponentID;
      const component =
        mainComponentID && this.project.components.get(mainComponentID);
      if (!component) {
        console.error(
          `Component ${mainComponentID} not found for instance ${node.id}`
        );
        return [];
      }
      return new ComponentCSSGenerator(component, this.imageURLs).generateCSS(
        [...instancePath, node.id],
        parentStackDirection
      );
    }

    const children = node.children.flatMap((child) =>
      this.generateNodeCSS(child, instancePath, stackDirection)
    );

    // TODO: variant styles
    const cssStyle = buildNodeCSS(node.type, style, parentStackDirection);
    if (isComponentRoot) {
      cssStyle.position = "relative";
      cssStyle.left = 0;
      cssStyle.top = 0;
    }

    const rule: CSSRule = {
      idPath,
      style: cssStyle,
    };

    return [rule, ...children];
  }
}

interface CSSRule {
  idPath: string[];
  style: React.CSSProperties;
}
