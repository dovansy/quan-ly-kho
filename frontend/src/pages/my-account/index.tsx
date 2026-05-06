import { Spin } from 'antd';
import { FiUser } from 'react-icons/fi';
import { useGetMe } from '@/hooks/api/auth';
import { ChangePasswordCard } from './components/ChangePasswordCard';
import { LogoutCard } from './components/LogoutCard';
import { ProfileCard } from './components/ProfileCard';

const MyAccountPage = () => {
  const { data: meRes, isLoading } = useGetMe();
  const user = meRes?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="mx-auto my-account-page">
      <h2 className="flex items-center gap-2 mb-6 text-2xl font-bold">
        <FiUser /> Tài khoản của tôi
      </h2>

      <ProfileCard user={user} />
      <ChangePasswordCard />
      <LogoutCard />
    </div>
  );
};

export default MyAccountPage;
