/** Input-only courier. It never clicks Send or reads a ChatGPT response. */
export function fillChatGptComposer(doc: Document, prompt: string): boolean {
  const composer = doc.querySelector<HTMLTextAreaElement>("textarea") ?? doc.querySelector<HTMLElement>("[contenteditable='true'][role='textbox'], [contenteditable='true']");
  if (!composer) return false;
  if (composer instanceof HTMLTextAreaElement) {
    const set = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
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

