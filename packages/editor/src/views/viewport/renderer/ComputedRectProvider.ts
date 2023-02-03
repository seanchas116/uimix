import { createAtom } from "mobx";
import { Rect } from "paintvec";

export const viewportRootMarker = "data-viewport-root";

function getComputedRect(element: Element): Rect {
  const offsetParent = (element as HTMLElement).offsetParent;
  if (!offsetParent) {
    return new Rect();
  }

  const localRect = Rect.from({
    left: (element as HTMLElement).offsetLeft,
    top: (element as HTMLElement).offsetTop,
    width: (element as HTMLElement).offsetWidth,
    height: (element as HTMLElement).offsetHeight,
  });

  if (offsetParent.hasAttribute(viewportRootMarker)) {
    return localRect;
  }

  const parentRect = getComputedRect(offsetParent);
  return localRect.translate(parentRect.topLeft);
}

export class ComputedRectProvider {
  constructor(element: Element) {
    this.element = element;
    this._value = getComputedRect(element);
  }

  readonly element: Element;
  private _value = Rect.from({ x: 0, y: 0, width: 0, height: 0 });
  private _dirty = false;
  private readonly atom = createAtom("ObservableComputedRect");

  get value(): Rect {
    this.atom.reportObserved();
    if (this._dirty) {
      this._value = getComputedRect(this.element);
      this._dirty = false;
    }
    return this._value;
  }

  get dirty(): boolean {
    return this._dirty;
  }

  markDirty(): void {
    this._dirty = true;
    this.atom.reportChanged();
  }
}
