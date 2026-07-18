import type { Capture, ResearchSession } from "../contracts.js";
import { captureIsAllowed, toDraft, type CaptureCandidate } from "../capture/capture.js";
import { CaptureMode } from "../capture/capture-mode.js";
import { copyPrompt, fillChatGptComposer } from "../gpt-courier.js";
import { createGptPrompt, createResearchPacket } from "../packet.js";
import { newSession, updateResearchQuestion } from "../session.js";
import { backupSession, evidenceWarnings, moveCapture, removeCapture, restoreSession, updateCapture } from "../session-tools.js";
import type { SessionStore } from "../storage/session-store.js";

const HOST_ID = "cassandra-research-tray";
const styles = `
  :host { all: initial; } *, *::before, *::after { box-sizing: border-box; }
  .launcher, .tray { font-family: ui-sans-serif, system-ui, sans-serif; color: #14231d; }
  .launcher { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; border: 0; border-radius: 999px; padding: 11px 15px; background: #174d3b; color: #fff; font-weight: 700; box-shadow: 0 4px 18px rgba(0,0,0,.24); cursor: pointer; }
  .tray { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; width: min(340px, calc(100vw - 32px)); overflow: hidden; border: 1px solid #b7d2c3; border-radius: 14px; background: #f8fcf8; box-shadow: 0 12px 35px rgba(10,35,25,.27); }
  header { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; padding: 16px 16px 12px; background: #e3f3e9; } h1 { margin: 0; font-size: 16px; } .tagline { margin: 3px 0 0; color: #416052; font-size: 12px; }
  button { font: inherit; cursor: pointer; } button:disabled { cursor: not-allowed; opacity: .55; } .icon { border: 0; background: transparent; padding: 3px; color: #305443; font-size: 18px; } main { padding: 14px 16px 16px; }
  label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; } textarea { width: 100%; min-height: 72px; resize: vertical; border: 1px solid #9bbbab; border-radius: 8px; padding: 8px; color: #14231d; background: #fff; font: inherit; font-size: 13px; }
  .metrics { display: flex; gap: 16px; margin: 14px 0; padding: 10px 0; border-top: 1px solid #d9e9df; border-bottom: 1px solid #d9e9df; font-size: 12px; } .metrics b { display: block; font-size: 16px; }.actions { display: grid; gap: 8px; }
  .primary, .secondary, .danger { border-radius: 8px; padding: 9px 10px; font-size: 13px; font-weight: 700; }.primary { border: 1px solid #174d3b; background: #174d3b; color: #fff; }.secondary { border: 1px solid #7aa590; background: #fff; color: #174d3b; }.danger { border: 0; padding: 5px 0; background: transparent; color: #9d2424; text-align: left; }.future { color: #5b6d63; font-size: 11px; line-height: 1.4; }.empty { margin: 0 0 12px; color: #476051; font-size: 13px; line-height: 1.45; }
`;

export class ResearchTray {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private session: ResearchSession | null = null;
  private draft: Capture | null = null;
  private panel: "session" | "trail" | "packet" = "session";

  public constructor(private readonly store: SessionStore, private readonly doc: Document = document) {
    this.host = this.doc.createElement("div"); this.host.id = HOST_ID; this.root = this.host.attachShadow({ mode: "closed" });
  }

  async mount(): Promise<void> {
    if (this.doc.getElementById(HOST_ID)) return;
    this.doc.documentElement.append(this.host); this.session = await this.store.load(); this.renderCollapsed();
  }

  private renderCollapsed(): void {
    this.root.replaceChildren();
    const launcher = this.doc.createElement("button"); launcher.className = "launcher"; launcher.type = "button";
    launcher.textContent = this.session ? `Cassandra · ${this.session.captures.length} captures` : "Open Cassandra";
    launcher.addEventListener("click", () => this.renderOpen()); this.appendStyleAnd(launcher);
  }

  private renderOpen(): void {
    this.root.replaceChildren(); const tray = this.doc.createElement("section"); tray.className = "tray"; tray.setAttribute("aria-label", "Cassandra research tray");
    const body = this.draft ? this.draftMarkup(this.draft) : this.panel === "trail" && this.session ? this.trailMarkup(this.session) : this.panel === "packet" && this.session ? this.packetMarkup(this.session) : this.session ? this.sessionMarkup(this.session) : this.emptyMarkup();
    tray.innerHTML = `<header><div><h1>Cassandra</h1><p class="tagline">Browse first. Ask better.</p></div><button class="icon" type="button" aria-label="Collapse Cassandra">×</button></header><main>${body}</main>`;
    tray.querySelector<HTMLButtonElement>(".icon")?.addEventListener("click", () => this.renderCollapsed());
    if (this.draft) this.bindDraftControls(tray); else if (this.panel === "trail" && this.session) this.bindTrailControls(tray); else if (this.panel === "packet" && this.session) this.bindPacketControls(tray); else if (this.session) this.bindSessionControls(tray); else this.bindCreateControls(tray); this.appendStyleAnd(tray);
  }

  private emptyMarkup(): string { return `<p class="empty">Start with the question you want to investigate. Cassandra will keep the research session on this browser.</p><label for="question">Research question</label><textarea id="question" placeholder="For example: How do urban trees affect summer temperatures?"></textarea><div class="actions"><button class="primary" type="button" data-create>Create research session</button></div>`; }
  private sessionMarkup(session: ResearchSession): string {
    const drafts = session.captures.filter((capture) => !capture.relevanceNote.trim()).length;
    return `<label for="question">Research question</label><textarea id="question">${this.escapeText(session.researchQuestion)}</textarea><div class="metrics"><span><b>${session.captures.length}</b>captures</span><span><b>${new Set(session.captures.map((capture) => capture.sourceId)).size}</b>sources</span>${drafts ? `<span><b>${drafts}</b>draft${drafts === 1 ? "" : "s"}</span>` : ""}</div><div class="actions"><button class="primary" type="button" data-save>Save question</button><button class="primary" type="button" data-capture>Capture something</button><button class="secondary" type="button" data-trail>Open evidence trail</button><button class="secondary" type="button" data-packet>Research packet & GPT-5.6</button><button class="secondary" type="button" data-backup>Download JSON backup</button><button class="secondary" type="button" data-restore>Restore JSON backup</button><input hidden type="file" accept="application/json,.json" data-restore-file><button class="danger" type="button" data-delete>Delete this research session</button></div><p class="future">Capture is deliberate. Cassandra never sends a prompt or reads an AI response.</p>`;
  }
  private trailMarkup(session: ResearchSession): string {
    const warnings = evidenceWarnings(session).map((warning) => `<p class="future">⚠ ${this.escapeText(warning.message)}</p>`).join("");
    const groups = new Map<string, Capture[]>(); for (const capture of session.captures) groups.set(capture.sourceId, [...(groups.get(capture.sourceId) ?? []), capture]);
    const evidence = [...groups.entries()].map(([sourceId, captures]) => { const source = captures[0]!.source; return `<section><p class="empty"><b>[${sourceId}] ${this.escapeText(source.title)}</b><br><a href="${this.safeUrl(source.canonicalUrl ?? source.url)}" target="_blank" rel="noreferrer">Open source</a><br>${this.escapeText(source.author ?? "Author unavailable")} · ${this.escapeText(source.publishedAt ?? "Date unavailable")}</p>${captures.map((capture) => `<p class="future"><b>${capture.relevanceNote ? "Evidence" : "Draft"}:</b> “${this.escapeText(capture.excerpt)}”<br><b>Why it matters:</b> ${this.escapeText(capture.relevanceNote || "Reflection required")}</p><div class="actions"><button class="secondary" type="button" data-edit="${capture.id}">Edit</button><button class="secondary" type="button" data-up="${capture.id}">Move up</button><button class="secondary" type="button" data-down="${capture.id}">Move down</button><button class="danger" type="button" data-remove="${capture.id}">Remove</button></div>`).join("")}</section>`; }).join("");
    return `<div class="actions"><button class="secondary" type="button" data-back>Back to session</button><button class="primary" type="button" data-packet>Preview research packet</button></div>${warnings}${evidence || `<p class="empty">No captures yet. Browse and deliberately capture a small piece of evidence.</p>`}`;
  }
  private packetMarkup(session: ResearchSession): string {
    try { const packet = createResearchPacket(session); return `<div class="actions"><button class="secondary" type="button" data-back>Back to session</button><button class="secondary" type="button" data-trail>Evidence trail</button><button class="primary" type="button" data-copy>Copy prompt</button><button class="primary" type="button" data-fill>Fill ChatGPT composer</button><button class="secondary" type="button" data-export>Download Markdown</button></div><p class="future">${session.captures.filter((capture) => capture.relevanceNote.trim()).length} ready items · ${new Set(session.captures.filter((capture) => capture.relevanceNote.trim()).map((capture) => capture.sourceId)).size} sources · ${packet.length} characters. Review before manually sending.</p><textarea readonly id="packet">${this.escapeText(packet)}</textarea>`; } catch (error) { return `<div class="actions"><button class="secondary" type="button" data-back>Back to session</button></div><p class="empty">${this.escapeText(error instanceof Error ? error.message : "Packet could not be generated.")}</p>`; }
  }
  private draftMarkup(draft: Capture): string { return `<p class="empty"><b>Captured draft</b><br>${this.escapeText(draft.excerpt)}</p><label for="relevance">Why does this matter to your question? *</label><textarea id="relevance" required placeholder="Connect this evidence to your research question."></textarea><p class="future">This is required. Until saved, this draft is excluded from any research packet.</p><div class="actions"><button class="primary" type="button" data-save-draft>Save capture</button><button class="secondary" type="button" data-cancel-draft>Discard draft</button></div>`; }

  private bindCreateControls(tray: HTMLElement): void { tray.querySelector<HTMLButtonElement>("[data-create]")?.addEventListener("click", async () => { this.session = newSession(tray.querySelector<HTMLTextAreaElement>("#question")?.value ?? ""); await this.store.save(this.session); this.renderOpen(); }); }
  private bindSessionControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-save]")?.addEventListener("click", async () => { if (!this.session) return; this.session = updateResearchQuestion(this.session, tray.querySelector<HTMLTextAreaElement>("#question")?.value ?? ""); await this.store.save(this.session); this.renderOpen(); });
    tray.querySelector<HTMLButtonElement>("[data-capture]")?.addEventListener("click", () => this.startCapture());
    tray.querySelector<HTMLButtonElement>("[data-trail]")?.addEventListener("click", () => { this.panel = "trail"; this.renderOpen(); });
    tray.querySelector<HTMLButtonElement>("[data-packet]")?.addEventListener("click", () => { this.panel = "packet"; this.renderOpen(); });
    tray.querySelector<HTMLButtonElement>("[data-backup]")?.addEventListener("click", () => this.download("cassandra-session.json", backupSession(this.session!))); 
    tray.querySelector<HTMLButtonElement>("[data-restore]")?.addEventListener("click", () => tray.querySelector<HTMLInputElement>("[data-restore-file]")?.click());
    tray.querySelector<HTMLInputElement>("[data-restore-file]")?.addEventListener("change", async (event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; try { this.session = restoreSession(await file.text()); await this.store.save(this.session); this.renderOpen(); } catch (error) { this.doc.defaultView?.alert(error instanceof Error ? error.message : "Restore failed."); } });
    tray.querySelector<HTMLButtonElement>("[data-delete]")?.addEventListener("click", async () => { if (!this.session || !this.doc.defaultView?.confirm("Delete this local Cassandra research session? This cannot be undone.")) return; await this.store.clear(); this.session = null; this.draft = null; this.renderOpen(); });
  }
  private bindTrailControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-back]")?.addEventListener("click", () => { this.panel = "session"; this.renderOpen(); });
    tray.querySelector<HTMLButtonElement>("[data-packet]")?.addEventListener("click", () => { this.panel = "packet"; this.renderOpen(); });
    tray.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((button) => button.addEventListener("click", async () => { if (!this.session || !this.doc.defaultView?.confirm("Remove this capture?")) return; this.session = removeCapture(this.session, button.dataset.remove!); await this.store.save(this.session); this.renderOpen(); }));
    tray.querySelectorAll<HTMLButtonElement>("[data-up], [data-down]").forEach((button) => button.addEventListener("click", async () => { if (!this.session) return; this.session = moveCapture(this.session, button.dataset.up ?? button.dataset.down!, button.dataset.up ? -1 : 1); await this.store.save(this.session); this.renderOpen(); }));
    tray.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((button) => button.addEventListener("click", async () => { if (!this.session) return; const capture = this.session.captures.find((item) => item.id === button.dataset.edit); if (!capture) return; const note = this.doc.defaultView?.prompt("Why does this matter to your question?", capture.relevanceNote) ?? null; if (note === null) return; const sourceType = this.doc.defaultView?.prompt("Source type: primary, secondary, reference, opinion, or unknown", capture.sourceType) ?? capture.sourceType; if (!(["primary", "secondary", "reference", "opinion", "unknown"] as string[]).includes(sourceType)) return; this.session = updateCapture(this.session, capture.id, { relevanceNote: note.trim(), ...(capture.followUpQuestion ? { followUpQuestion: capture.followUpQuestion } : {}), sourceType: sourceType as Capture["sourceType"] }); await this.store.save(this.session); this.renderOpen(); }));
  }
  private bindPacketControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-back]")?.addEventListener("click", () => { this.panel = "session"; this.renderOpen(); }); tray.querySelector<HTMLButtonElement>("[data-trail]")?.addEventListener("click", () => { this.panel = "trail"; this.renderOpen(); });
    const prompt = () => this.session ? createGptPrompt(this.session) : "";
    tray.querySelector<HTMLButtonElement>("[data-copy]")?.addEventListener("click", async () => { await copyPrompt(this.doc, prompt()); this.doc.defaultView?.alert("Prompt copied. Paste it into ChatGPT, review it, then send manually."); });
    tray.querySelector<HTMLButtonElement>("[data-fill]")?.addEventListener("click", async () => { if (fillChatGptComposer(this.doc, prompt())) this.doc.defaultView?.alert("Prompt filled. Review it and click Send yourself."); else { await copyPrompt(this.doc, prompt()); this.doc.defaultView?.alert("No ChatGPT composer is available on this page. The prompt was copied instead."); } });
    tray.querySelector<HTMLButtonElement>("[data-export]")?.addEventListener("click", () => { if (this.session) this.download("cassandra-research-packet.md", createResearchPacket(this.session)); });
  }
  private bindDraftControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-save-draft]")?.addEventListener("click", async () => { if (!this.session || !this.draft) return; const relevanceNote = tray.querySelector<HTMLTextAreaElement>("#relevance")?.value.trim() ?? ""; if (!relevanceNote) { tray.querySelector<HTMLTextAreaElement>("#relevance")?.focus(); return; } const draftId = this.draft.id; this.session = { ...this.session, updatedAt: new Date().toISOString(), captures: this.session.captures.map((capture) => capture.id === draftId ? { ...capture, relevanceNote } : capture) }; await this.store.save(this.session); this.draft = null; this.renderOpen(); });
    tray.querySelector<HTMLButtonElement>("[data-cancel-draft]")?.addEventListener("click", async () => { if (!this.session || !this.draft) return; const draftId = this.draft.id; this.session = { ...this.session, updatedAt: new Date().toISOString(), captures: this.session.captures.filter((capture) => capture.id !== draftId) }; await this.store.save(this.session); this.draft = null; this.renderOpen(); });
  }
  private startCapture(): void {
    if (!this.session) return; if (!captureIsAllowed(this.doc)) { this.doc.defaultView?.alert("Cassandra capture is disabled on this private or local surface."); return; }
    this.renderCollapsed(); const mode = new CaptureMode(this.doc, (candidate) => { void this.createDraft(candidate); }, () => this.renderOpen()); mode.start();
  }
  private async createDraft(candidate: CaptureCandidate): Promise<void> { if (!this.session) return; this.draft = toDraft(candidate, this.session); this.session = { ...this.session, updatedAt: new Date().toISOString(), captures: [...this.session.captures, this.draft] }; await this.store.save(this.session); this.renderOpen(); }
  private download(filename: string, content: string): void { const blob = new Blob([content], { type: filename.endsWith(".json") ? "application/json" : "text/markdown" }); const url = URL.createObjectURL(blob); const link = this.doc.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); }
  private safeUrl(value: string): string { try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.href : "#"; } catch { return "#"; } }
  private appendStyleAnd(node: Node): void { const style = this.doc.createElement("style"); style.textContent = styles; this.root.append(style, node); }
  private escapeText(value: string): string { return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
}
