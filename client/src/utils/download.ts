const apiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
const apiPrefix = apiBase ? `${apiBase}/api` : '/api';

export type IdeaFileKey = 'pdf' | 'word' | 'file';

export function buildIdeaDownloadUrl(ideaId: number | string, key: IdeaFileKey) {
  const idSegment = encodeURIComponent(String(ideaId).trim());
  const normalizedKey: IdeaFileKey = key;
  return `${apiPrefix}/ideas/${idSegment}/files/${normalizedKey}`;
}

export function buildIdeaFolderDownloadUrl(ideaId: number | string) {
  const idSegment = encodeURIComponent(String(ideaId).trim());
  return `${apiPrefix}/ideas/${idSegment}/download`;
}
