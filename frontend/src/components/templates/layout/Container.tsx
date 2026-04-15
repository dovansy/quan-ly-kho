import AppLoading from '@/components/atoms/AppLoading';
import { Spin } from 'antd';
import clsx from 'clsx';

interface LoadingContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  loading?: boolean;
  fullScreen?: boolean;
}

export const Container = ({
  children,
  loading,
  fullScreen,
  className,
  ...props
}: LoadingContainerProps) => {
  const classNames = clsx(
    {
      relative: !fullScreen && loading,
    },
    className
  );

  return (
    <div className={classNames} {...props}>
      {children}
      {loading && (
        <Spin
          indicator={<AppLoading />}
          fullscreen
          className={clsx('!bg-gray-18 opacity-50', {
            '!absolute !top-0 !left-0 !w-full !h-full': !fullScreen,
          })}
        />
      )}
    </div>
  );
};
