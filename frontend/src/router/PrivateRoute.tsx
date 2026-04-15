import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTE_PATH } from '@/constants/app';
import { useAppSelector, useAppDispatch } from '@/shared/redux/hooks';
import { selectIsAuthenticated } from '@/store/auth/selectors';
import { updateUser } from '@/store/auth';
import { authService } from '@/services/auth.service';

export default function PrivateRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  // Sync user data từ server mỗi khi app load
  useEffect(() => {
    if (isAuthenticated) {
      authService.getMe().then(res => {
        if (res.data?.data) {
          dispatch(updateUser(res.data.data));
        }
      }).catch(() => {});
    }
  }, [isAuthenticated, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATH.LOGIN} replace />;
  }

  return <Outlet />;
}
