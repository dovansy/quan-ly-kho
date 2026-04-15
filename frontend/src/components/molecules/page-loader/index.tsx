import { Spin } from 'antd';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spin size="large" />
    </div>
  );
}
