import { Switch, SwitchProps } from 'antd';
import { forwardRef } from 'react';
import './AppSwitch.scss';

export const AppSwitch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, size, ...props }: SwitchProps, ref) => {
    return <Switch ref={ref} className={className} size={size} {...props} />;
  }
);

AppSwitch.displayName = 'AppSwitch';
