import { candidateFromElement, candidateFromSelection, type CaptureCandidate } from "./capture.js";

export class CaptureMode {
  private active = false;
  private highlighted: HTMLElement | null = null;

  public constructor(private readonly doc: Document, private readonly onSelect: (candidate: CaptureCandidate) => void, private readonly onCancel: () => void) {}

  start(): void {
    if (this.active) return;
    const selected = candidateFromSelection(this.doc.defaultView?.getSelection() ?? this.doc.getSelection()!, this.doc);
    if (selected) { this.onSelect(selected); return; }
    this.active = true;
    this.doc.addEventListener("pointerover", this.onPointerOver, true);
    this.doc.addEventListener("click", this.onClick, true);
    this.doc.addEventListener("keydown", this.onKeyDown, true);
    this.doc.documentElement.dataset.cassandraCaptureMode = "true";
  }

  stop(): void {
    if (!this.active) return;
    this.active = false;
    this.clearHighlight();
    this.doc.removeEventListener("pointerover", this.onPointerOver, true);
    this.doc.removeEventListener("click", this.onClick, true);
    this.doc.removeEventListener("keydown", this.onKeyDown, true);
    delete this.doc.documentElement.dataset.cassandraCaptureMode;
  }

  private onPointerOver = (event: PointerEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target && candidateFromElement(target);
    this.clearHighlight();
    if (candidate && target instanceof HTMLElement) {
      this.highlighted = target;
      target.style.outline = "3px solid #174d3b";
      target.style.outlineOffset = "3px";
    }
  };

  private onClick = (event: MouseEvent): void => {
    const target = event.target instanceof Element ? event.target : null;
    const candidate = target && candidateFromElement(target);
    if (!candidate) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this.stop();
    this.onSelect(candidate);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    this.stop();
    this.onCancel();
  };

  private clearHighlight(): void {
    if (!this.highlighted) return;
    this.highlighted.style.outline = "";
    this.highlighted.style.outlineOffset = "";
    this.highlighted = null;
  }
}

