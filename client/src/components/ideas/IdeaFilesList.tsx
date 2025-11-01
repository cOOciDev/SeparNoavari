import type { IdeaFile } from "../../types/domain";
import { buildFileUrl } from "../../utils/download";
import styles from "./ideaFilesList.module.scss";

export type IdeaFilesListProps = {
  files: IdeaFile[];
};

const formatSize = (bytes?: number | null) => {
  if (!bytes || Number.isNaN(bytes)) return "";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
};

const IdeaFilesList = ({ files }: IdeaFilesListProps) => {
  if (!files || files.length === 0) {
    return <p className={styles.empty}>No files uploaded.</p>;
  }

  return (
    <ul className={styles.list}>
      {files.map((file) => {
        const url = buildFileUrl(file.path);
        return (
          <li key={file.storedName ?? file.path} className={styles.item}>
            <a href={url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {file.originalName ?? file.path}
            </a>
            <span className={styles.meta}>
              {formatSize(file.size)}
              {file.mime ? ` • ${file.mime}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export default IdeaFilesList;
