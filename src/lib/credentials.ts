export function generateCredentialId() {
  const year = new Date().getFullYear();
  const segment = crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `NX-${year}-${segment}`;
}
