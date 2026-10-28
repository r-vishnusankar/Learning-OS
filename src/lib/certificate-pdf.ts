/** Client-side certificate print / PDF helpers */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function openCertificatePrintWindow(opts: {
  title: string;
  holderName: string;
  credentialId: string;
  department: string;
  level: string;
  score?: number;
  issuedAt?: string;
  verifyUrl: string;
  qrDataUrl?: string;
}) {
  const scoreLine = opts.score != null ? `${opts.score}%` : "—";
  const issued = opts.issuedAt ?? "—";
  // qrDataUrl is a data: URL we generated; keep it out of HTML-escape so the img src stays valid
  const qr = opts.qrDataUrl
    ? `<img src="${opts.qrDataUrl.replace(/"/g, "")}" alt="QR" width="120" height="120" />`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(opts.title)}</title>
  <style>
    @page { size: landscape; margin: 16mm; }
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1a1a; margin: 0; }
    .frame { border: 3px double #b8860b; padding: 40px 48px; min-height: 520px; box-sizing: border-box; }
    .brand { letter-spacing: 0.25em; text-transform: uppercase; font-size: 11px; color: #666; text-align: center; }
    h1 { text-align: center; font-size: 28px; margin: 24px 0 8px; }
    .sub { text-align: center; color: #555; }
    .name { text-align: center; font-size: 36px; margin: 20px 0; }
    .title { text-align: center; font-size: 22px; color: #0f4c81; margin: 12px 0 28px; }
    .meta { display: flex; justify-content: space-around; margin: 32px 0; font-size: 14px; text-align: center; }
    .meta span { display: block; color: #888; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
    .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; }
    .cred { font-family: ui-monospace, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div class="frame">
    <div class="brand">Skillrr · Learning that unlocks achievement</div>
    <h1>Certificate of Achievement</h1>
    <p class="sub">This certifies that</p>
    <div class="name">${escapeHtml(opts.holderName)}</div>
    <p class="sub">has successfully demonstrated proficiency in</p>
    <div class="title">${escapeHtml(opts.title)}</div>
    <div class="meta">
      <div><span>Department</span>${escapeHtml(opts.department)}</div>
      <div><span>Level</span>${escapeHtml(opts.level)}</div>
      <div><span>Score</span>${escapeHtml(scoreLine)}</div>
      <div><span>Issued</span>${escapeHtml(issued)}</div>
    </div>
    <div class="footer">
      <div>
        <div class="cred">Credential ID: ${escapeHtml(opts.credentialId)}</div>
        <div class="cred">Verify: ${escapeHtml(opts.verifyUrl)}</div>
      </div>
      <div>${qr}</div>
    </div>
  </div>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  // Do NOT pass noopener/noreferrer in features: window.open then returns null
  // (MDN) and the print HTML is never written. Drop opener after write instead.
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return false;
  try {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.opener = null;
    return true;
  } catch {
    try {
      win.close();
    } catch {
      // ignore
    }
    return false;
  }
}
