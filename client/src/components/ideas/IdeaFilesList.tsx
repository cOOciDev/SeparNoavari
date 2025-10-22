import { List, Typography } from "antd";
import type { IdeaFile } from "../../types/domain";
import { buildFileUrl } from "../../utils/download";

export type IdeaFilesListProps = {
  files: IdeaFile[];
};

const formatSize = (bytes?: number | null) => {
  if (!bytes || Number.isNaN(bytes)) return "-";
  const mb = bytes / 1024 / 1024;
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = bytes / 1024;
  return `${kb.toFixed(2)} KB`;
};

const IdeaFilesList = ({ files }: IdeaFilesListProps) => {
  if (!files || files.length === 0) {
    return <Typography.Text type="secondary">No files uploaded.</Typography.Text>;
  }

  return (
    <List
      dataSource={files}
      renderItem={(file) => {
        const url = buildFileUrl(file.path);
        return (
          <List.Item>
            <List.Item.Meta
              title={
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {file.originalName}
                </a>
              }
              description={`${formatSize(file.size)} • ${file.mime}`}
            />
          </List.Item>
        );
      }}
    />
  );
};

export default IdeaFilesList;
