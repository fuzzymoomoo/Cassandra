import type { Capture, ResearchSession } from "./contracts.js";

export function eligibleCaptures(session: ResearchSession): Capture[] {
  return session.captures.filter((capture) => capture.relevanceNote.trim().length > 0);
}

export interface EvidenceWarning { kind: "single-domain" | "missing-metadata"; message: string; }

export function evidenceWarnings(session: ResearchSession): EvidenceWarning[] {
  const captures = eligibleCaptures(session);
  if (!captures.length) return [];
  const domains = new Set(captures.map((capture) => { try { return new URL(capture.source.canonicalUrl ?? capture.source.url).hostname; } catch { return "unknown"; } }));
  const warnings: EvidenceWarning[] = [];
  if (domains.size === 1) warnings.push({ kind: "single-domain", message: "All ready evidence currently comes from one domain. Consider comparing another source." });
  if (captures.some((capture) => !capture.source.author || !capture.source.publishedAt)) warnings.push({ kind: "missing-metadata", message: "Some sources do not show an author or publication date." });
  return warnings;
}

export function updateCapture(session: ResearchSession, id: string, changes: { relevanceNote: string; sourceType: Capture["sourceType"]; followUpQuestion?: string }): ResearchSession {
  return { ...session, updatedAt: new Date().toISOString(), captures: session.captures.map((capture) => capture.id === id ? { ...capture, ...changes } : capture) };
}

export function removeCapture(session: ResearchSession, id: string): ResearchSession {
  return { ...session, updatedAt: new Date().toISOString(), captures: session.captures.filter((capture) => capture.id !== id) };
}

export function moveCapture(session: ResearchSession, id: string, direction: -1 | 1): ResearchSession {
  const index = session.captures.findIndex((capture) => capture.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= session.captures.length) return session;
  const captures = [...session.captures]; [captures[index], captures[target]] = [captures[target]!, captures[index]!];
  return { ...session, updatedAt: new Date().toISOString(), captures };
}

export function backupSession(session: ResearchSession): string { return JSON.stringify({ format: "cassandra-session-v1", session }, null, 2); }

export function restoreSession(json: string): ResearchSession {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || !Object.hasOwn(parsed, "format") || (parsed as { format: unknown }).format !== "cassandra-session-v1") throw new Error("This is not a Cassandra session backup.");
  const session = (parsed as { session: unknown }).session;
  if (!session || typeof session !== "object") throw new Error("Backup has no session.");
  const value = session as Partial<ResearchSession>;
  if (typeof value.id !== "string" || typeof value.title !== "string" || typeof value.researchQuestion !== "string" || !Array.isArray(value.captures)) throw new Error("Backup session is incomplete.");
  return value as ResearchSession;
}
