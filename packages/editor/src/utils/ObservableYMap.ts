import { createAtom } from "mobx";
import * as Y from "yjs";

const instances = new WeakMap<Y.Map<any>, ObservableYMap<any>>();

export class ObservableYMap<V> {
  static get<V>(target: Y.Map<V>): ObservableYMap<V> {
    let map = instances.get(target);
    if (!map) {
      map = new ObservableYMap(target);
      instances.set(target, map);
    }
    return map;
  }

  readonly y: Y.Map<V>;
  readonly _atom = createAtom("ObservableYMap");

  private constructor(y: Y.Map<V>) {
    this.y = y;
    this.y.observe(() => {
      this._atom.reportChanged();
    });
  }

  get size(): number {
    this._atom.reportObserved();
    return this.y.size;
  }

  set(key: string, value: V): void {
    this.y.set(key, value);
  }

  delete(key: string): void {
    this.y.delete(key);
  }

  get(key: string): V | undefined {
    this._atom.reportObserved();
    return this.y.get(key);
  }

  getOrCreate(key: string, create: () => V): V {
    this._atom.reportObserved();
    if (!this.y.has(key)) {
      this.y.set(key, create());
    }
    return this.y.get(key)!;
  }

  has(key: string): boolean {
    this._atom.reportObserved();
    return this.y.has(key);
  }

  clear() {
    this.y.clear();
  }

  keys(): IterableIterator<string> {
    this._atom.reportObserved();
    return this.y.keys();
  }

  values(): IterableIterator<V> {
    this._atom.reportObserved();
    return this.y.values();
  }

  [Symbol.iterator](): IterableIterator<[string, V]> {
    this._atom.reportObserved();
    return this.y[Symbol.iterator]();
  }

  toJSON(): Record<string, V> {
    this._atom.reportObserved();
    return this.y.toJSON();
  }
}
