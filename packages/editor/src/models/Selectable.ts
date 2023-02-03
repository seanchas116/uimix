import { computed, makeObservable, observable } from "mobx";
import { Rect, Vec2 } from "paintvec";
import { generateID } from "../utils/ID";
import { Variant } from "./ComponentNode";
import { groupLikeNodeTypes, Node } from "./Node";
import {
  createCascadedStyle,
  defaultStyle,
  PartialStyle,
  IStyle,
} from "./Style";

const selectables = new WeakMap<
  Node,
  {
    default: Selectable;
    forVariant: WeakMap<Variant, Selectable>;
  }
>();

export class Selectable {
  static get(node: Node, variant?: Variant): Selectable {
    let selectablesForNode = selectables.get(node);
    if (!selectablesForNode) {
      const selectable = new Selectable(node, variant);

      if (!variant) {
        selectablesForNode = {
          default: selectable,
          forVariant: new WeakMap(),
        };
      } else {
        selectablesForNode = {
          default: this.get(node),
          forVariant: new WeakMap([[variant, selectable]]),
        };
      }
      selectables.set(node, selectablesForNode);
      return selectablesForNode.default;
    }

    if (!variant) {
      return selectablesForNode.default;
    }

    let selectable = selectablesForNode.forVariant.get(variant);
    if (!selectable) {
      selectable = new Selectable(node, variant);
      selectablesForNode.forVariant.set(variant, selectable);
    }
    return selectable;
  }

  private constructor(node: Node, variant: Variant | undefined) {
    this.node = node;
    this.variant = variant;
    makeObservable(this);
  }

  readonly key = generateID();
  readonly node: Node;
  readonly variant: Variant | undefined;

  @observable private _selected: boolean = false;

  get selected(): boolean {
    return this._selected;
  }

  select() {
    this._selected = true;
    for (const child of this.children) {
      child.deselect();
    }
  }

  deselect() {
    this._selected = false;
    for (const child of this.children) {
      child.deselect();
    }
  }

  @computed get isGroupLike(): boolean {
    return groupLikeNodeTypes.includes(this.node.type);
  }

  @computed get children(): Selectable[] {
    if (this.node.type === "component") {
      const variants = [undefined, ...this.node.variants];
      const rootNode = this.node.firstChild;
      if (!rootNode) {
        return [];
      }
      return variants.map((variant) => Selectable.get(rootNode, variant));
    }

    return this.node.children.map((child) =>
      Selectable.get(child, this.variant)
    );
  }

  @computed get inFlowChildren(): Selectable[] {
    return this.children.filter((child) => child.inFlow);
  }

  @computed get inFlow(): boolean {
    // TODO: absolute positioned elements
    return this.parent?.node.type === "stack";
  }

  get parent(): Selectable | undefined {
    if (!this.node.parent) {
      return;
    }
    if (this.node.parent.type === "component") {
      // variant
      return Selectable.get(this.node.parent, undefined);
    }
    return Selectable.get(this.node.parent, this.variant);
  }

  get offsetParent(): Selectable | undefined {
    const parent = this.parent;
    if (!parent) {
      return;
    }
    if (parent.isGroupLike) {
      return parent.offsetParent;
    }
    return parent;
  }

  // ancestors ([root, ..., parent, this])
  get ancestors(): readonly Selectable[] {
    const result: Selectable[] = [];
    let current: Selectable | undefined = this;
    while (current) {
      result.unshift(current);
      current = current.parent;
    }
    return result;
  }

  get root(): Selectable {
    return Selectable.get(this.node.root);
  }

  @computed.struct get selectedDescendants(): Selectable[] {
    if (this.selected) {
      return [this];
    }
    return this.children.flatMap((child) => child.selectedDescendants);
  }

  @computed get ancestorSelected(): boolean {
    return this.selected || !!this.parent?.ancestorSelected;
  }

  @observable collapsed = false;

  @observable computedRectProvider: { value: Rect | undefined } | undefined =
    undefined;

  @computed get computedRect(): Rect {
    if (this.isGroupLike) {
      return (
        Rect.union(...this.children.map((child) => child.computedRect)) ??
        new Rect()
      );
    }
    return this.computedRectProvider?.value ?? new Rect();
  }

  @computed get offsetComputedRect(): Rect {
    const { offsetParent } = this;
    if (!offsetParent) {
      return this.computedRect;
    }
    return this.computedRect.translate(offsetParent.computedRect.topLeft.neg);
  }

  @computed get computedLeft(): number {
    const offsetParent = this.offsetParent;
    if (offsetParent) {
      return this.computedRect.left - offsetParent.computedRect.left;
    }
    return this.computedRect.left;
  }

  @computed get computedTop(): number {
    const offsetParent = this.offsetParent;
    if (offsetParent) {
      return this.computedRect.top - offsetParent.computedRect.top;
    }
    return this.computedRect.top;
  }

  @computed get computedRight(): number | undefined {
    const offsetParent = this.offsetParent;
    if (offsetParent) {
      return offsetParent.computedRect.right - this.computedRect.right;
    }
  }

  @computed get computedBottom(): number | undefined {
    const offsetParent = this.offsetParent;
    if (offsetParent) {
      return offsetParent.computedRect.bottom - this.computedRect.bottom;
    }
  }

  readonly partialStyle = new PartialStyle({
    onWillChange: () => this.node.notifyWillChange(),
    onDidChange: () => this.node.notifyDidChange(),
  });

  get style(): IStyle {
    let baseStyle: IStyle = defaultStyle;
    if (this.node.type === "instance") {
      const componentRoot = this.node.componentRootNode;
      if (componentRoot) {
        baseStyle = Selectable.get(componentRoot).style;
      }
    }

    return createCascadedStyle(
      this.partialStyle,
      this.variant ? Selectable.get(this.node, undefined).style : baseStyle
    );
  }

  get isVariant(): boolean {
    return this.parent?.node.type === "component";
  }

  resizeWithBoundingBox(
    bbox: Rect,
    targets: {
      x?: boolean;
      y?: boolean;
      width?: boolean;
      height?: boolean;
    }
  ) {
    const offsetTopLeft =
      this.offsetParent?.computedRect.topLeft ?? new Vec2(0);

    if (targets.x) {
      this.style.position = {
        ...this.style.position,
        x: {
          type: "start",
          start: bbox.left - offsetTopLeft.x,
        },
      };
    }
    if (targets.y) {
      this.style.position = {
        ...this.style.position,
        y: {
          type: "start",
          start: bbox.top - offsetTopLeft.y,
        },
      };
    }
    if (targets.width) {
      this.style.width = {
        type: "fixed",
        value: bbox.width,
      };
    }
    if (targets.height) {
      this.style.height = {
        type: "fixed",
        value: bbox.height,
      };
    }
  }
}
