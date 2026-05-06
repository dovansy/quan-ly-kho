import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import { AppButton } from '@/components/atoms/AppButton';
import { ROUTE_PATH } from '@/constants/app';
import { useAppDispatch } from '@/shared/redux/hooks';
import { logout } from '@/store/auth';

export const LogoutCard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('access_token');
    navigate(ROUTE_PATH.LOGIN);
  };

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-red-600">
            <FiLogOut /> Đăng xuất
          </h3>
          <p className="text-sm text-gray-500">Đăng xuất khỏi tài khoản hiện tại</p>
        </div>
        <AppButton danger onClick={handleLogout}>
          Đăng xuất
        </AppButton>
      </div>
    </Card>
  );
};
