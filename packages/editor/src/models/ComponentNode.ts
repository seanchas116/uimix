import { startCase } from "lodash-es";
import { intercept, makeObservable, observable, observe } from "mobx";
import {
  ComponentNodeData,
  NodeData,
  Property,
  VariantCondition,
  VariantData,
} from "node-data";
import { generateID } from "../utils/ID";
import { ObservableChangeWatcher } from "../utils/ObservableChangeWatcher";
import { NodeBase } from "./NodeBase";

export class ComponentNode extends NodeBase {
  constructor(id?: string) {
    super(id);
    this.watchPropChanges();

    intercept(this.variants, (change) => {
      this.notifyWillChange();
      return change;
    });
    observe(this.variants, (change) => {
      if (change.type === "update") {
        change.oldValue._component = undefined;
        change.newValue._component = this;
      } else {
        for (const removed of change.removed) {
          removed._component = undefined;
        }
        for (const added of change.added) {
          added._component = this;
        }
      }
      this.notifyDidChange();
    });

    intercept(this.props, (change) => {
      this.notifyWillChange();
      return change;
    });
    observe(this.props, () => {
      this.notifyDidChange();
    });
  }

  readonly variants = observable.array<Variant>();
  readonly props = observable.array<Property>();

  get type(): "component" {
    return "component";
  }

  get canHaveChildren(): boolean {
    return true;
  }

  serialize(): ComponentNodeData {
    return {
      ...this.serializeCommon(),
      type: "component",
      props: [...this.props],
      variants: this.variants.map((variant) => variant.serialize()),
    };
  }

  deserialize(data: NodeData): void {
    if (data.type !== "component") {
      throw new Error("Invalid node type");
    }
    super.deserialize(data);

    this.variants.replace(
      (data.variants ?? []).map((variantData) => Variant.fromData(variantData))
    );
    this.props.replace(data.props ?? []);
  }
}

// cache variant to make sure undo/redo works
const variantForID = new Map<string, Variant>();

export class Variant {
  private constructor(id: string) {
    this.id = id;
    makeObservable(this);

    new ObservableChangeWatcher(
      this,
      () => {
        this._component?.notifyDidChange();
      },
      () => {
        this._component?.notifyWillChange();
      }
    );
  }

  // set by component
  _component: ComponentNode | undefined;
  get component(): ComponentNode | undefined {
    return this._component;
  }

  readonly id: string;

  @observable.ref condition: VariantCondition = {
    type: "interaction",
    value: "hover",
  };

  serialize(): VariantData {
    return {
      id: this.id,
      condition: this.condition,
    };
  }

  static create() {
    const variant = new Variant(generateID());
    variantForID.set(variant.id, variant);
    return variant;
  }

  static fromData(data: VariantData) {
    let variant = variantForID.get(data.id);
    if (!variant) {
      variant = new Variant(data.id);
      variantForID.set(data.id, variant);
    }
    variant.condition = data.condition;
    return variant;
  }

  get displayName(): string {
    switch (this.condition.type) {
      case "interaction":
        return startCase(this.condition.value);
      case "maxWidth":
        return `Mobile < ${this.condition.value}`;
    }
  }
}
