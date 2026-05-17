import { Layout } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import Header from '@/components/organisms/header';
import './MainLayout.scss';

const { Content, Sider } = Layout;

interface MainLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
}

const STORAGE_KEY = 'mainLayout.sidebarCollapsed';

const MainLayout = ({ sidebar, children }: MainLayoutProps) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <Layout className="main-layout">
      <Header />
      <Content>
        <Layout className="container">
          <Sider
            width={296}
            collapsedWidth={0}
            collapsed={collapsed}
            trigger={null}
            className="sider-admin"
          >
            {sidebar}
          </Sider>
          <button
            type="button"
            className="sider-toggle"
            style={{ left: collapsed ? 0 : 296 }}
            aria-label={collapsed ? 'Mở menu' : 'Đóng menu'}
            onClick={() => setCollapsed(c => !c)}
          >
            {collapsed ? <FiChevronRight size={16} /> : <FiChevronLeft size={16} />}
          </button>
          <Content className="main-content">{children}</Content>
        </Layout>
      </Content>
    </Layout>
  );
};

export default MainLayout;
