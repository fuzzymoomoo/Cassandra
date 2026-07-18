import type { Capture, ResearchSession } from "../contracts.js";
import { captureIsAllowed, toDraft, type CaptureCandidate } from "../capture/capture.js";
import { CaptureMode } from "../capture/capture-mode.js";
import { copyPrompt, fillChatGptComposer } from "../gpt-courier.js";
import { createGptPrompt, createResearchPacket } from "../packet.js";
import { newSession, updateResearchQuestion } from "../session.js";
import { backupSession, evidenceWarnings, moveCapture, removeCapture, restoreSession, updateCapture } from "../session-tools.js";
import type { SessionStore } from "../storage/session-store.js";
import cassandraLogo from "../../spec/cassandra-logo-transparent.png";

const HOST_ID = "cassandra-research-tray";
const styles = `
  :host { all: initial; --midnight:#10072d; --purple:#7138b8; --purple-dark:#572794; --gold:#e5b942; --ivory:#fffaf3; --ink:#191522; --line:#ead8bf; }
  *, *::before, *::after { box-sizing: border-box; }
  .launcher, .tray { font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--ink); }
  .launcher { position:fixed; right:22px; bottom:22px; z-index:2147483647; border:1px solid rgba(229,185,66,.78); border-radius:999px; padding:12px 18px; background:linear-gradient(135deg,var(--midnight),#21104d); color:#fff; font-weight:750; letter-spacing:.01em; box-shadow:0 12px 30px rgba(16,7,45,.3); cursor:pointer; }
  .launcher::before { content:"✦"; color:var(--gold); margin-right:8px; }
  .tray { position:fixed; right:20px; bottom:20px; z-index:2147483647; display:flex; flex-direction:column; width:min(410px,calc(100vw - 32px)); height:min(760px,calc(100dvh - 36px)); max-height:calc(100vh - 36px); overflow:hidden; border:1px solid #d8bd91; border-radius:18px; background:var(--ivory); box-shadow:0 20px 55px rgba(16,7,45,.3); }
  header { display:flex; justify-content:space-between; gap:12px; align-items:center; padding:17px 18px 15px; color:#fff; background:radial-gradient(circle at 15% 0,rgba(113,56,184,.3),transparent 38%),linear-gradient(135deg,#0c0626,var(--midnight)); border-bottom:1px solid rgba(229,185,66,.55); }
  .brand { min-width:0; } .brand-row { display:flex; align-items:center; gap:9px; } .logo { width:178px; height:46px; object-fit:contain; object-position:left center; padding:4px 6px; border-radius:8px; background:#fffaf3; }
  .saved { color:#f3cc55; font-size:10px; font-weight:750; white-space:nowrap; } .tagline { margin:6px 0 0; color:#f5eefc; font-size:11px; font-weight:600; }
  button { font:inherit; cursor:pointer; } button:disabled { cursor:not-allowed; opacity:.5; } .icon { border:0; background:transparent; padding:4px; color:#fff; font-size:20px; } main { flex:1 1 auto; min-height:0; overflow-x:hidden; overflow-y:auto; overscroll-behavior:contain; padding:14px 14px 28px; scrollbar-gutter:stable; scrollbar-color:#9d69d1 transparent; }
  label { display:block; margin:0 0 7px; color:var(--purple-dark); font-size:12px; font-weight:800; } textarea,select { width:100%; border:1px solid #dfbd8a; border-radius:10px; padding:10px 11px; color:var(--ink); background:#fffdfa; font:inherit; font-size:13px; line-height:1.45; outline:none; } textarea { min-height:74px; resize:vertical; } textarea:focus,select:focus { border-color:#8e55ce; box-shadow:0 0 0 3px rgba(113,56,184,.12); } select { margin-bottom:10px; }
  .metrics { display:flex; gap:8px; margin:12px 0; padding:9px; border:1px solid var(--line); border-radius:10px; background:#fffdf9; font-size:11px; } .metrics span { flex:1; padding:2px 6px; border-right:1px solid #eee1d0; } .metrics span:last-child { border:0; } .metrics b { display:block; color:var(--purple-dark); font-size:17px; }
  .actions { display:grid; gap:7px; grid-template-columns:repeat(2,minmax(0,1fr)); } .actions > :only-child, .actions > .danger, .actions > input { grid-column:1/-1; }
  .primary,.secondary,.danger { border-radius:10px; padding:10px 11px; font-size:12px; font-weight:780; }.primary { border:1px solid #6b31aa; background:linear-gradient(135deg,#8546c8,#6931aa); color:#fff; box-shadow:0 4px 12px rgba(113,56,184,.16); }.primary:hover { background:var(--purple-dark); }.secondary { border:1px solid #e1c7a3; background:#fffdfa; color:#3e2457; }.secondary:hover { border-color:#9d69d1; background:#faf5ff; }.danger { border:0; padding:7px 2px; background:transparent; color:#a23131; text-align:left; }
  section { margin:12px 0; padding:11px; border:1px solid var(--line); border-radius:12px; background:#fffdf9; } section .actions { margin-top:8px; }
  a { color:var(--purple); font-weight:700; text-decoration:none; } a:hover { text-decoration:underline; }.future { color:#665c6b; font-size:11px; line-height:1.5; }.empty { margin:0 0 12px; padding:11px; border:1px solid var(--line); border-radius:11px; background:#fffdf9; color:#4a3b4f; font-size:13px; line-height:1.48; }
  #packet { min-height:280px; margin-top:10px; font-family:ui-monospace,SFMono-Regular,Consolas,monospace; font-size:10px; }
  @media (max-width:460px) { .tray { right:8px; bottom:8px; width:calc(100vw - 16px); height:calc(100dvh - 16px); max-height:calc(100vh - 16px); } .actions { grid-template-columns:1fr; } }
`;

export class ResearchTray {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private session: ResearchSession | null = null;
  private draft: Capture | null = null;
  private panel: "session" | "trail" | "packet" = "session";

  public constructor(private readonly store: SessionStore, private readonly doc: Document = document) {
    this.host = this.doc.createElement("div"); this.host.id = HOST_ID;
    const fixtureTest = new URL(this.doc.location.href).searchParams.get("cassandra-browser-test") === "1";
    this.root = this.host.attachShadow({ mode: fixtureTest ? "open" : "closed" });
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
    tray.innerHTML = `<header><div class="brand"><div class="brand-row"><img class="logo" src="${cassandraLogo}" alt="Cassandra"><span class="saved">◇ SAVED LOCALLY</span></div><p class="tagline">Don’t just be right. Bring the evidence.</p></div><button class="icon" type="button" aria-label="Collapse Cassandra">×</button></header><main>${body}</main>`;
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
  private draftMarkup(draft: Capture): string { return `<p class="empty"><b>Captured draft</b><br>${this.escapeText(draft.excerpt)}</p><label for="relevance">Why does this matter to your question? *</label><textarea id="relevance" required placeholder="Connect this evidence to your research question."></textarea><label for="source-type">What kind of source is this?</label><select id="source-type"><option value="unknown">Unknown</option><option value="primary">Primary</option><option value="secondary">Secondary</option><option value="reference">Reference</option><option value="opinion">Opinion</option></select><label for="follow-up">What should you investigate next? (optional)</label><textarea id="follow-up" placeholder="Add a checking question or next lead."></textarea><p class="future">The relevance note is required. Until saved, this draft is excluded from every research packet.</p><div class="actions"><button class="primary" type="button" data-save-draft>Save capture</button><button class="secondary" type="button" data-cancel-draft>Discard draft</button></div>`; }

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
    tray.querySelectorAll<HTMLButtonElement>("[data-edit]").forEach((button) => button.addEventListener("click", async () => { if (!this.session) return; const capture = this.session.captures.find((item) => item.id === button.dataset.edit); if (!capture) return; const note = this.doc.defaultView?.prompt("Why does this matter to your question?", capture.relevanceNote) ?? null; if (note === null) return; const sourceType = this.doc.defaultView?.prompt("Source type: primary, secondary, reference, opinion, or unknown", capture.sourceType) ?? capture.sourceType; if (!(["primary", "secondary", "reference", "opinion", "unknown"] as string[]).includes(sourceType)) return; const followUpQuestion = this.doc.defaultView?.prompt("What should you investigate next? (optional)", capture.followUpQuestion ?? "")?.trim(); this.session = updateCapture(this.session, capture.id, { relevanceNote: note.trim(), ...(followUpQuestion ? { followUpQuestion } : {}), sourceType: sourceType as Capture["sourceType"] }); await this.store.save(this.session); this.renderOpen(); }));
  }
  private bindPacketControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-back]")?.addEventListener("click", () => { this.panel = "session"; this.renderOpen(); }); tray.querySelector<HTMLButtonElement>("[data-trail]")?.addEventListener("click", () => { this.panel = "trail"; this.renderOpen(); });
    const prompt = () => this.session ? createGptPrompt(this.session) : "";
    tray.querySelector<HTMLButtonElement>("[data-copy]")?.addEventListener("click", async () => { await copyPrompt(this.doc, prompt()); this.doc.defaultView?.alert("Prompt copied. Paste it into ChatGPT, review it, then send manually."); });
    tray.querySelector<HTMLButtonElement>("[data-fill]")?.addEventListener("click", async () => { if (fillChatGptComposer(this.doc, prompt())) this.doc.defaultView?.alert("Prompt filled. Review it and click Send yourself."); else { await copyPrompt(this.doc, prompt()); this.doc.defaultView?.alert("No ChatGPT composer is available on this page. The prompt was copied instead."); } });
    tray.querySelector<HTMLButtonElement>("[data-export]")?.addEventListener("click", () => { if (this.session) this.download("cassandra-research-packet.md", createResearchPacket(this.session)); });
  }
  private bindDraftControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-save-draft]")?.addEventListener("click", async () => { if (!this.session || !this.draft) return; const relevanceNote = tray.querySelector<HTMLTextAreaElement>("#relevance")?.value.trim() ?? ""; if (!relevanceNote) { tray.querySelector<HTMLTextAreaElement>("#relevance")?.focus(); return; } const sourceType = tray.querySelector<HTMLSelectElement>("#source-type")?.value as Capture["sourceType"] ?? "unknown"; const followUpQuestion = tray.querySelector<HTMLTextAreaElement>("#follow-up")?.value.trim(); const draftId = this.draft.id; this.session = { ...this.session, updatedAt: new Date().toISOString(), captures: this.session.captures.map((capture) => capture.id === draftId ? { ...capture, relevanceNote, sourceType, ...(followUpQuestion ? { followUpQuestion } : {}) } : capture) }; await this.store.save(this.session); this.draft = null; this.renderOpen(); });
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
