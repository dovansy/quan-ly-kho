import { forwardRef } from 'react';

import { Input, InputProps, InputRef } from 'antd';
import clsx from 'clsx';

import { Search } from '@/components/atoms/AppIcons';
import styles from './AppSearch.module.scss';

interface AppSearchProps extends InputProps {
  onSearchClick?: () => void;
}

export const AppSearch = forwardRef<InputRef, AppSearchProps>(
  ({ onSearchClick, className, placeholder = 'Search', ...props }: AppSearchProps, ref) => {
    const classNames = clsx(className, styles.appSearch);

    return (
      <Input
        ref={ref}
        placeholder={placeholder}
        className={classNames}
        prefix={
          <div onClick={onSearchClick}>
            <Search />
          </div>
        }
        {...props}
      />
    );
  }
);

AppSearch.displayName = 'AppSearch';
