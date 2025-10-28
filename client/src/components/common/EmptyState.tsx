import { Result } from "antd";
import type { ReactNode } from "react";

export type EmptyStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

const EmptyState = ({
  title = "No data",
  description = "There is nothing to show yet.",
  action,
}: EmptyStateProps) => (
  <Result status="info" title={title} subTitle={description} extra={action ?? null} />
);

export default EmptyState;
