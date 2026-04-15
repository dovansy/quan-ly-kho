import { createContext, useCallback } from 'react';

import { notification } from 'antd';
import clsx from 'clsx';

import styles from './Notification.module.scss';
import { Notification, NotificationParams } from './types';

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationContext = createContext<Notification>({
  error: (_params: NotificationParams) => {},
  info: (_params: NotificationParams) => {},
  success: (_params: NotificationParams) => {},
  warning: (_params: NotificationParams) => {},
});

interface NotificationProviderProps {
  children: React.ReactNode;
}

const { useNotification } = notification;

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const [rawApi, contextHolder] = useNotification({ placement: 'topRight' });

  const error = useCallback(
    ({ styleType = 'filled', message, className, ...props }: NotificationParams) => {
      const classNames = clsx(className, styleType, styles.notify);

      rawApi.error({
        message: message ?? 'Error',
        className: classNames,
        duration: 5,
        ...props,
      });
    },
    [rawApi]
  );

  const info = useCallback(
    ({ styleType = 'filled', message, className, ...props }: NotificationParams) => {
      const classNames = clsx(className, styleType, styles.notify);

      rawApi.info({
        message: message ?? 'Information',
        className: classNames,

        duration: 5,
        ...props,
      });
    },
    [rawApi]
  );

  const warning = useCallback(
    ({ styleType = 'filled', message, className, ...props }: NotificationParams) => {
      const classNames = clsx(className, styleType, styles.notify);

      rawApi.warning({
        message: message ?? 'Warning',
        className: classNames,

        duration: 5,
        ...props,
      });
    },
    [rawApi]
  );

  const success = useCallback(
    ({ styleType = 'filled', message, className, ...props }: NotificationParams) => {
      const classNames = clsx(className, styleType, styles.notify);

      rawApi.success({
        message: message ?? 'Success',
        className: classNames,
        duration: 5,
        ...props,
      });
    },
    [rawApi]
  );

  return (
    <NotificationContext.Provider
      value={{
        rawApi,
        error,
        info,
        success,
        warning,
      }}
    >
      {children}
      {contextHolder}
    </NotificationContext.Provider>
  );
};
