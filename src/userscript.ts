import { SessionStore } from "./storage/session-store.js";
import { ResearchTray } from "./ui/research-tray.js";

function startCassandra(): void {
  void new ResearchTray(new SessionStore()).mount();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startCassandra, { once: true });
else startCassandra();
