/** Strip markup so comments stay plain text in notifications and UI. Keeps newlines. */
export function toPlainTextComment(value: string, maxLength = 1000): string {
  return value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength);
}
