export function generatePassCode(): string {
  const random = crypto.randomUUID().split("-")[0].toUpperCase();
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `GP-${date}-${random}`;
}
