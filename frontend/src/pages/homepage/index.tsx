import { Outlet } from 'react-router-dom';

import { MainLayout } from '@/components/templates/main-layout';
import MenuAdmin from './components/MenuAdmin';
import './scss/homepage.scss';

const HomePage = () => {
  return (
    <MainLayout sidebar={<MenuAdmin />}>
      <Outlet />
    </MainLayout>
  );
};

export default HomePage;
