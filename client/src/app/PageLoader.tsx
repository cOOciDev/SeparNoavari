import { Spin } from 'antd';


export const PageLoader = () => (
  <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
    <Spin size="large" />
  </div>
);