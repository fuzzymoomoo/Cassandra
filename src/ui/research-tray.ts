import type { ResearchSession } from "../contracts.js";
import { newSession, updateResearchQuestion } from "../session.js";
import type { SessionStore } from "../storage/session-store.js";

const HOST_ID = "cassandra-research-tray";

const styles = `
  :host { all: initial; }
  *, *::before, *::after { box-sizing: border-box; }
  .launcher, .tray { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #14231d; }
  .launcher { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; border: 0; border-radius: 999px; padding: 11px 15px; background: #174d3b; color: #fff; font-weight: 700; box-shadow: 0 4px 18px rgba(0,0,0,.24); cursor: pointer; }
  .tray { position: fixed; right: 18px; bottom: 18px; z-index: 2147483647; width: min(340px, calc(100vw - 32px)); overflow: hidden; border: 1px solid #b7d2c3; border-radius: 14px; background: #f8fcf8; box-shadow: 0 12px 35px rgba(10,35,25,.27); }
  header { display: flex; justify-content: space-between; gap: 8px; align-items: flex-start; padding: 16px 16px 12px; background: #e3f3e9; }
  h1 { margin: 0; font-size: 16px; letter-spacing: .01em; } .tagline { margin: 3px 0 0; color: #416052; font-size: 12px; }
  button { font: inherit; cursor: pointer; } .icon { border: 0; background: transparent; padding: 3px; color: #305443; font-size: 18px; }
  main { padding: 14px 16px 16px; } label { display: block; margin-bottom: 6px; font-size: 12px; font-weight: 700; }
  textarea { width: 100%; min-height: 72px; resize: vertical; border: 1px solid #9bbbab; border-radius: 8px; padding: 8px; color: #14231d; background: #fff; font: inherit; font-size: 13px; }
  .metrics { display: flex; gap: 16px; margin: 14px 0; padding: 10px 0; border-top: 1px solid #d9e9df; border-bottom: 1px solid #d9e9df; font-size: 12px; } .metrics b { display: block; font-size: 16px; }
  .actions { display: grid; gap: 8px; } .primary, .secondary, .danger { border-radius: 8px; padding: 9px 10px; font-size: 13px; font-weight: 700; }
  .primary { border: 1px solid #174d3b; background: #174d3b; color: #fff; } .secondary { border: 1px solid #7aa590; background: #fff; color: #174d3b; } .danger { border: 0; padding: 5px 0; background: transparent; color: #9d2424; text-align: left; }
  .future { color: #5b6d63; font-size: 11px; line-height: 1.4; } .empty { margin: 0 0 12px; color: #476051; font-size: 13px; line-height: 1.45; }
`;

export class ResearchTray {
  private readonly host: HTMLDivElement;
  private readonly root: ShadowRoot;
  private session: ResearchSession | null = null;

  public constructor(private readonly store: SessionStore, private readonly doc: Document = document) {
    this.host = this.doc.createElement("div");
    this.host.id = HOST_ID;
    this.root = this.host.attachShadow({ mode: "closed" });
  }

  async mount(): Promise<void> {
    if (this.doc.getElementById(HOST_ID)) return;
    this.doc.documentElement.append(this.host);
    this.session = await this.store.load();
    this.renderCollapsed();
  }

  private renderCollapsed(): void {
    this.root.replaceChildren();
    const launcher = this.doc.createElement("button");
    launcher.className = "launcher";
    launcher.type = "button";
    launcher.textContent = this.session ? `Cassandra · ${this.session.captures.length} captures` : "Open Cassandra";
    launcher.addEventListener("click", () => this.renderOpen());
    this.appendStyleAnd(launcher);
  }

  private renderOpen(): void {
    this.root.replaceChildren();
    const tray = this.doc.createElement("section");
    tray.className = "tray";
    tray.setAttribute("aria-label", "Cassandra research tray");
    const existing = this.session;
    tray.innerHTML = `<header><div><h1>Cassandra</h1><p class="tagline">Browse first. Ask better.</p></div><button class="icon" type="button" aria-label="Collapse Cassandra">×</button></header><main>${existing ? this.sessionMarkup(existing) : this.emptyMarkup()}</main>`;
    tray.querySelector<HTMLButtonElement>(".icon")?.addEventListener("click", () => this.renderCollapsed());
    if (existing) this.bindSessionControls(tray); else this.bindCreateControls(tray);
    this.appendStyleAnd(tray);
  }

  private emptyMarkup(): string {
    return `<p class="empty">Start with the question you want to investigate. Cassandra will keep the research session on this browser.</p><label for="question">Research question</label><textarea id="question" placeholder="For example: How do urban trees affect summer temperatures?"></textarea><div class="actions"><button class="primary" type="button" data-create>Create research session</button></div>`;
  }

  private sessionMarkup(session: ResearchSession): string {
    return `<label for="question">Research question</label><textarea id="question">${this.escapeText(session.researchQuestion)}</textarea><div class="metrics"><span><b>${session.captures.length}</b>captures</span><span><b>${new Set(session.captures.map((capture) => capture.sourceId)).size}</b>sources</span></div><div class="actions"><button class="primary" type="button" data-save>Save question</button><button class="secondary" type="button" disabled title="Capture arrives in Wave 2">Capture something (coming next)</button><button class="secondary" type="button" disabled title="Evidence trail arrives in Wave 3">Open evidence trail (coming next)</button><button class="secondary" type="button" disabled title="GPT courier arrives in Wave 3">Chat with GPT-5.6 (coming next)</button><button class="danger" type="button" data-delete>Delete this research session</button></div><p class="future">Capture, trail, export, and ChatGPT composer filling are intentionally unavailable in this Wave 1 shell.</p>`;
  }

  private bindCreateControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-create]")?.addEventListener("click", async () => {
      const question = tray.querySelector<HTMLTextAreaElement>("#question")?.value ?? "";
      this.session = newSession(question);
      await this.store.save(this.session);
      this.renderOpen();
    });
  }

  private bindSessionControls(tray: HTMLElement): void {
    tray.querySelector<HTMLButtonElement>("[data-save]")?.addEventListener("click", async () => {
      if (!this.session) return;
      const question = tray.querySelector<HTMLTextAreaElement>("#question")?.value ?? "";
      this.session = updateResearchQuestion(this.session, question);
      await this.store.save(this.session);
      this.renderOpen();
    });
    tray.querySelector<HTMLButtonElement>("[data-delete]")?.addEventListener("click", async () => {
      if (!this.doc.defaultView?.confirm("Delete this local Cassandra research session? This cannot be undone.")) return;
      await this.store.clear();
      this.session = null;
      this.renderOpen();
    });
  }

  private appendStyleAnd(node: Node): void {
    const style = this.doc.createElement("style");
    style.textContent = styles;
    this.root.append(style, node);
  }

  private escapeText(value: string): string {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
}

