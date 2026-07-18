import { SessionStore } from "./storage/session-store.js";
import { ResearchTray } from "./ui/research-tray.js";

// Wave 1: local session tray only. Capture, evidence, export, and GPT courier are not implemented.
void new ResearchTray(new SessionStore()).mount();
