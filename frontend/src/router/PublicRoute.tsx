import { Navigate, Outlet } from 'react-router-dom';
import { ROUTE_PATH } from '@/constants/app';
import { useAppSelector } from '@/shared/redux/hooks';
import { selectIsAuthenticated } from '@/store/auth/selectors';

export default function PublicRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTE_PATH.INVENTORY} replace />;
  }

  return <Outlet />;
}
