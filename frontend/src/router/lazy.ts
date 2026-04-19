import { lazy } from 'react';

export const LoginPage = lazy(() => import('@/pages/login'));
export const HomePage = lazy(() => import('@/pages/homepage'));
export const MyAccountPage = lazy(() => import('@/pages/my-account'));
export const InventoryPage = lazy(() => import('@/pages/inventory'));
export const SalesPage = lazy(() => import('@/pages/sales'));
export const AccountsPage = lazy(() => import('@/pages/accounts'));
export const ProductsPage = lazy(() => import('@/pages/products'));
export const WarehousesPage = lazy(() => import('@/pages/warehouses'));
export const ImportsPage = lazy(() => import('@/pages/imports'));
export const SmallUnitsPage = lazy(() => import('@/pages/small-units'));
