import { Layout } from 'antd';
import { ReactNode } from 'react';

import Header from '@/components/organisms/header';

const { Content, Sider } = Layout;

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const MainLayout = ({ sidebar, children }: MainLayoutProps) => {
  return (
    <Layout className="main-layout">
      <Header />
      <Content>
        <Layout className="container">
          <Sider width={296} className="sider-admin">
            {sidebar}
          </Sider>
          <Content className="main-content">{children}</Content>
        </Layout>
      </Content>
    </Layout>
  );
};

export default MainLayout;
