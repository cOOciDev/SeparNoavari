import { ReactNode } from "react";
import { Typography } from "antd";

import styles from "./pageHeader.module.scss";

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  gutter?: number;
};

const PageHeader = ({ title, subtitle, actions, gutter = 16 }: PageHeaderProps) => (
  <div className={styles.header} style={{ gap: gutter }}>
    <div className={styles.texts}>
      <Typography.Title level={3} className={styles.title}>
        {title}
      </Typography.Title>
      {subtitle ? (
        <Typography.Paragraph className={styles.subtitle}>{subtitle}</Typography.Paragraph>
      ) : null}
    </div>
    {actions ? <div className={styles.actions}>{actions}</div> : null}
  </div>
);

export default PageHeader;
