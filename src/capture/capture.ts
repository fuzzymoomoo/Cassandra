import type { Capture, CaptureKind, ResearchSession } from "../contracts.js";
import { MAX_CAPTURE_EXCERPT_CHARACTERS, CAPTURE_EXCLUSIONS, isBlockedCaptureHost } from "../policy.js";

export type CaptureCandidate = Omit<Capture, "id" | "sourceId" | "relevanceNote" | "sourceType">;

const SKIPPED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

export function captureIsAllowed(doc: Document): boolean {
  return !isBlockedCaptureHost(doc.location.hostname);
}

export function isSafeCaptureElement(element: Element | null): element is HTMLElement {
  const HTMLElementConstructor = element?.ownerDocument.defaultView?.HTMLElement;
  if (!HTMLElementConstructor || !(element instanceof HTMLElementConstructor)) return false;
  if (element.closest("#cassandra-research-tray")) return false;
  if (element.closest(CAPTURE_EXCLUSIONS.elementSelectors.join(","))) return false;
  for (let current: HTMLElement | null = element; current; current = current.parentElement) {
    if (current.hidden || current.getAttribute("aria-hidden") === "true") return false;
  }
  return !SKIPPED_TAGS.has(element.tagName);
}

export function sanitizeExcerpt(value: string): string {
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_CAPTURE_EXCERPT_CHARACTERS) return normalized;
  const marker = "… [truncated]";
  return `${normalized.slice(0, MAX_CAPTURE_EXCERPT_CHARACTERS - marker.length).trimEnd()}${marker}`;
}

function visibleText(element: Element): string {
  const values: string[] = [];
  const walker = element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && isSafeCaptureElement(parent) && !parent.closest("script,style,noscript,template")) values.push(node.textContent ?? "");
    node = walker.nextNode();
  }
  return sanitizeExcerpt(values.join(" "));
}

function locatorHint(element: Element): string | undefined {
  const escape = (value: string): string => typeof CSS !== "undefined" && CSS.escape ? CSS.escape(value) : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  if (element.id) return `#${escape(element.id)}`;
  const name = element.tagName.toLowerCase();
  const className = element.classList[0];
  return className ? `${name}.${escape(className)}` : name;
}

function sourceDetails(doc: Document): Capture["source"] {
  const meta = (name: string): string | undefined => doc.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)?.content?.trim() || undefined;
  const canonicalUrl = doc.querySelector<HTMLLinkElement>("link[rel='canonical']")?.href;
  const author = meta("author");
  const publishedAt = meta("article:published_time") ?? meta("date");
  return {
    url: doc.location.href,
    ...(canonicalUrl ? { canonicalUrl } : {}),
    title: doc.title.trim() || "Untitled page",
    ...(author ? { author } : {}),
    ...(publishedAt ? { publishedAt } : {}),
    capturedAt: new Date().toISOString()
  };
}

function tableRowExcerpt(row: HTMLTableRowElement): string {
  const table = row.closest("table");
  if (!table) return visibleText(row);
  const rows = Array.from(table.rows);
  const rowIndex = rows.indexOf(row);
  const headerRow = rows.slice(0, Math.max(rowIndex, 0)).reverse().find((item) => item.querySelector("th"));
  const headers = headerRow ? Array.from(headerRow.cells).map((cell) => visibleText(cell)) : [];
  return sanitizeExcerpt(Array.from(row.cells).map((cell, index) => `${headers[index] || `Column ${index + 1}`}: ${visibleText(cell)}`).join("; "));
}

function imageExcerpt(image: HTMLImageElement): string {
  const caption = image.closest("figure")?.querySelector("figcaption");
  return sanitizeExcerpt(`Image: ${image.alt || "No alt text"}${caption ? ` — ${visibleText(caption)}` : ""}; image URL: ${image.currentSrc || image.src}`);
}

function kindFor(element: HTMLElement): CaptureKind {
  const view = element.ownerDocument.defaultView;
  if (view && element instanceof view.HTMLImageElement) return "image-reference";
  if (view && element instanceof view.HTMLAnchorElement) return "link";
  if (view && element instanceof view.HTMLTableRowElement) return "table-row";
  if (/^H[1-6]$/.test(element.tagName)) return "heading";
  return "text";
}

export function candidateFromElement(element: Element, doc = element.ownerDocument): CaptureCandidate | null {
  if (!captureIsAllowed(doc) || !isSafeCaptureElement(element)) return null;
  const kind = kindFor(element);
  const excerpt = kind === "image-reference" ? imageExcerpt(element as HTMLImageElement)
    : kind === "table-row" ? tableRowExcerpt(element as HTMLTableRowElement)
      : visibleText(element);
  if (!excerpt) return null;
  const selectorHint = locatorHint(element);
  return { kind, excerpt, source: sourceDetails(doc), ...(selectorHint ? { locator: { selectorHint } } : {}) };
}

export function candidateFromSelection(selection: Selection, doc: Document): CaptureCandidate | null {
  if (!captureIsAllowed(doc) || selection.rangeCount === 0 || !selection.toString().trim()) return null;
  const container = selection.getRangeAt(0).commonAncestorContainer;
  const parent = container.nodeType === Node.ELEMENT_NODE ? container as Element : container.parentElement;
  if (!isSafeCaptureElement(parent)) return null;
  const excerpt = sanitizeExcerpt(selection.toString());
  const selectorHint = locatorHint(parent);
  return excerpt ? { kind: "text", excerpt, source: sourceDetails(doc), locator: { textFragment: excerpt, ...(selectorHint ? { selectorHint } : {}) } } : null;
}

export function toDraft(candidate: CaptureCandidate, session: ResearchSession): Capture {
  const url = candidate.source.canonicalUrl ?? candidate.source.url;
  const existing = session.captures.find((capture) => (capture.source.canonicalUrl ?? capture.source.url) === url);
  return {
    id: globalThis.crypto.randomUUID(), sourceId: existing?.sourceId ?? `S${new Set(session.captures.map((capture) => capture.sourceId)).size + 1}`,
    ...candidate, relevanceNote: "", sourceType: "unknown"
  };
}
