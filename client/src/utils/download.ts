const apiBase = (import.meta.env.VITE_API_BASE || "/api").replace(/\/$/, "");

export function buildFileUrl(path: string) {
  if (!path) return "#";
  const normalized = path.startsWith("/") ? path.slice(1) : path;
  return `${apiBase}/${normalized}`;
}

export function downloadFile(path: string, filename?: string) {
  const url = buildFileUrl(path);
  const anchor = document.createElement("a");
  anchor.href = url;
  if (filename) anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
