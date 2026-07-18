/** Input-only courier. It never clicks Send or reads a ChatGPT response. */
export function fillChatGptComposer(doc: Document, prompt: string): boolean {
  const host = doc.location.hostname.toLowerCase();
  const isTestFixture = new URL(doc.location.href).searchParams.get("cassandra-browser-test") === "1";
  if (host !== "chatgpt.com" && host !== "chat.openai.com" && !isTestFixture) return false;
  const composer = doc.querySelector<HTMLTextAreaElement>("#prompt-textarea, textarea[data-testid*='prompt'], textarea") ?? doc.querySelector<HTMLElement>("[contenteditable='true'][role='textbox']");
  if (!composer) return false;
  const TextareaConstructor = doc.defaultView?.HTMLTextAreaElement;
  if (TextareaConstructor && composer instanceof TextareaConstructor) {
    const set = Object.getOwnPropertyDescriptor(TextareaConstructor.prototype, "value")?.set;
    set?.call(composer, prompt);
  } else composer.textContent = prompt;
  composer.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }));
  composer.dispatchEvent(new Event("change", { bubbles: true }));
  composer.focus();
  return true;
}

export async function copyPrompt(doc: Document, prompt: string): Promise<boolean> {
  try { await doc.defaultView?.navigator.clipboard?.writeText(prompt); return true; } catch { /* fallback below */ }
  const textarea = doc.createElement("textarea"); textarea.value = prompt; textarea.setAttribute("readonly", ""); textarea.style.position = "fixed"; textarea.style.opacity = "0";
  doc.body.append(textarea); textarea.select(); const copied = doc.execCommand("copy"); textarea.remove(); return copied;
}
