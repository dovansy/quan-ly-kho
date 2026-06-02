import React, { useEffect, useState } from 'react';

import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTE_PATH } from '@/constants/app';
import { useAppDispatch } from '@/shared/redux/hooks';
import { logout as logoutAction } from '@/store/auth';
import {
  FiBox,
  FiShoppingCart,
  FiUsers,
  FiLayers,
  FiPackage,
  FiHome,
  FiLogOut,
  FiDownload,
  FiRepeat,
  FiTag,
  FiBarChart2,
} from 'react-icons/fi';

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: 'group',
  linkTo?: string
): MenuItem {
  return {
    label: linkTo ? <Link to={linkTo}>{label}</Link> : label,
    key,
    icon,
    children,
    type,
  } as MenuItem;
}

const MenuAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const items: MenuProps['items'] = [
    getItem('Quản lý tồn kho', 'inventory', <FiBox />, undefined, undefined, ROUTE_PATH.INVENTORY),
    getItem('Quản lý nhập hàng', 'imports', <FiDownload />, undefined, undefined, ROUTE_PATH.IMPORTS),
    getItem('Quản lý xuất hàng', 'sales', <FiShoppingCart />, undefined, undefined, ROUTE_PATH.SALES),
    getItem('Thống kê doanh số', 'sales-report', <FiBarChart2 />, undefined, undefined, ROUTE_PATH.SALES_REPORT),
    getItem('Quản lý chuyển kho', 'transfers', <FiRepeat />, undefined, undefined, ROUTE_PATH.TRANSFERS),
    getItem('Quản lý tài khoản', 'accounts', <FiUsers />, undefined, undefined, ROUTE_PATH.ACCOUNTS),
    getItem('Quản lý tài nguyên', 'resources', <FiLayers />, [
      getItem('Danh sách sản phẩm', 'products', <FiPackage />, undefined, undefined, ROUTE_PATH.PRODUCTS),
      getItem('Danh sách kho', 'warehouses', <FiHome />, undefined, undefined, ROUTE_PATH.WAREHOUSES),
      getItem('Đơn vị lẻ', 'small-units', <FiTag />, undefined, undefined, ROUTE_PATH.SMALL_UNITS),
    ]),
    getItem('Đăng xuất', 'logout', <FiLogOut />, undefined, undefined),
  ];

  useEffect(() => {
    const pathnameLevel1 = location.pathname.split('/')[1] || 'home';

    // Auto-select and open based on current path
    const keyMap: { [key: string]: { key: string; parent?: string } } = {
      inventory: { key: 'inventory' },
      imports: { key: 'imports' },
      sales: { key: 'sales' },
      'sales-report': { key: 'sales-report' },
      transfers: { key: 'transfers' },
      accounts: { key: 'accounts' },
      products: { key: 'products', parent: 'resources' },
      warehouses: { key: 'warehouses', parent: 'resources' },
      'small-units': { key: 'small-units', parent: 'resources' },
      'my-profile': { key: 'my-profile' },
    };

    const currentMatch = keyMap[pathnameLevel1];
    if (currentMatch) {
      setSelectedKeys([currentMatch.key]);
      if (currentMatch.parent) {
        setOpenKeys(prev => Array.from(new Set([...prev, currentMatch.parent!])));
      }
    }
  }, [location.pathname]);

  const handleMenuOpenChange = (keys: string[]) => {
    setOpenKeys(keys);
  };

  const handleLogout = () => {
    dispatch(logoutAction());
    localStorage.removeItem('access_token');
    navigate(ROUTE_PATH.LOGIN);
  };

  const handleMenuSelect = ({ key }: { key: string }) => {
    if (key === 'logout') {
      handleLogout();
      return;
    }
    setSelectedKeys([key]);
  };

  useEffect(() => {
    window.scroll({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  return (
    <Menu
      onSelect={handleMenuSelect}
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleMenuOpenChange}
      mode="inline"
      items={items}
    />
  );
};

export default MenuAdmin;
