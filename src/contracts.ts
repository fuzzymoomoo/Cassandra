/** Frozen Wave 0 public data contracts. Changes require a documented migration. */
export type CaptureKind = "text" | "heading" | "link" | "image-reference" | "table-row";
export type SourceType = "primary" | "secondary" | "reference" | "opinion" | "unknown";

export interface ResearchSession {
  id: string;
  title: string;
  researchQuestion: string;
  createdAt: string;
  updatedAt: string;
  captures: Capture[];
}

export interface Capture {
  id: string;
  sourceId: string;
  kind: CaptureKind;
  excerpt: string;
  relevanceNote: string;
  followUpQuestion?: string;
  sourceType: SourceType;
  source: {
    url: string;
    canonicalUrl?: string;
    title: string;
    author?: string;
    publishedAt?: string;
    capturedAt: string;
  };
  locator?: {
    textFragment?: string;
    selectorHint?: string;
  };
}

