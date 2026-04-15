import { Avatar, Button, Flex, Row } from 'antd';
import { FiUser } from 'react-icons/fi';

import { AppButton } from '@/components/atoms/AppButton';
import { useAppSelector } from '@/shared/redux/hooks';
import { selectUser } from '@/store/auth/selectors';
import './index.scss';

const Header = () => {
  const user = useAppSelector(selectUser);
  const displayName = user?.fullName || user?.username || 'Guest';

  return (
    <div id="header">
      <div className="container">
        <Flex justify="between" className="header-wrap">
          <Row className="nav">
            <Button href="#" type="link" className="logo">
              Logo
            </Button>
            <Flex className="user-info" align="center" gap={8}>
              <Avatar icon={<FiUser />} />
              <AppButton href="/my-profile" type="link" className="capitalize user-name">
                {displayName}
              </AppButton>
            </Flex>
          </Row>
        </Flex>
      </div>
    </div>
  );
};

export default Header;
