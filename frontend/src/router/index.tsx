import { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { NotificationProvider } from '@/components/templates/notification';

import PrivateRoute from '@/router/PrivateRoute';
import PublicRoute from '@/router/PublicRoute';

import PageLoader from '@/components/molecules/page-loader';

import '@scss/globals.scss';

import {
  HomePage,
  LoginPage,
  MyAccountPage,
  InventoryPage,
  SalesPage,
  AccountsPage,
  ProductsPage,
  WarehousesPage,
  ImportsPage,
  TransfersPage,
  SmallUnitsPage,
} from '@/router/lazy';
import { ROUTE_PATH } from '@/constants/app';

export default function AppContainer() {
  return (
    <NotificationProvider>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route element={<PublicRoute />}>
              <Route path={ROUTE_PATH.LOGIN} element={<LoginPage />} />
            </Route>

            {/* Private */}
            <Route element={<PrivateRoute />}>
              <Route path={ROUTE_PATH.HOME} element={<HomePage />}>
                <Route index element={<Navigate to={ROUTE_PATH.INVENTORY} replace />} />
                <Route path={ROUTE_PATH.MY_PROFILE} element={<MyAccountPage />} />
                <Route path={ROUTE_PATH.INVENTORY} element={<InventoryPage />} />
                <Route path={ROUTE_PATH.SALES} element={<SalesPage />} />
                <Route path={ROUTE_PATH.ACCOUNTS} element={<AccountsPage />} />
                <Route path={ROUTE_PATH.PRODUCTS} element={<ProductsPage />} />
                <Route path={ROUTE_PATH.WAREHOUSES} element={<WarehousesPage />} />
                <Route path={ROUTE_PATH.IMPORTS} element={<ImportsPage />} />
                <Route path={ROUTE_PATH.TRANSFERS} element={<TransfersPage />} />
                <Route path={ROUTE_PATH.SMALL_UNITS} element={<SmallUnitsPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </NotificationProvider>
  );
}
