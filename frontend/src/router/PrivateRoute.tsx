import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { ROUTE_PATH } from '@/constants/app';
import { useAppSelector, useAppDispatch } from '@/shared/redux/hooks';
import { selectIsAuthenticated } from '@/store/auth/selectors';
import { updateUser } from '@/store/auth';
import { useGetMe } from '@/hooks/api/auth';

export default function PrivateRoute() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  // react-query dedupe + cache → StrictMode mount 2 lần cũng chỉ 1 request /auth/me.
  const { data: meRes } = useGetMe(isAuthenticated);

  useEffect(() => {
    if (meRes?.data) dispatch(updateUser(meRes.data));
  }, [meRes, dispatch]);

  if (!isAuthenticated) {
    return <Navigate to={ROUTE_PATH.LOGIN} replace />;
  }

  return <Outlet />;
}
