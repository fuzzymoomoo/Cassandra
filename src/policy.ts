/** Frozen Wave 0 safety, privacy, and packet-size policy. */
export const MAX_CAPTURE_EXCERPT_CHARACTERS = 800;
export const MAX_PACKET_CAPTURES = 20;
export const MAX_PACKET_CHARACTERS = 24_000;

/** Never capture a form control, editable content, or a private-account surface. */
export const CAPTURE_EXCLUSIONS = {
  elementSelectors: [
    "input",
    "textarea",
    "select",
    "option",
    "button",
    "[contenteditable='true']",
    "[contenteditable='']",
    "[role='textbox']",
    "[type='password']"
  ],
  blockedHostPatterns: [
    "localhost",
    "127.0.0.1",
    "::1",
    "mail.google.",
    "outlook.",
    "mail.yahoo.",
    "drive.google.",
    "dropbox.",
    "onedrive.",
    "bank",
    "health",
    "patient",
    "mychart",
    "slack.",
    "teams."
  ]
} as const;

export function isBlockedCaptureHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return CAPTURE_EXCLUSIONS.blockedHostPatterns.some((pattern) =>
    host === pattern || host.includes(pattern)
  );
}

