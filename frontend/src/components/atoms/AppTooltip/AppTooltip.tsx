import { Tooltip, TooltipProps } from 'antd';
import clsx from 'clsx';
import styles from './AppTooltip.module.scss';

export const AppTooltip = ({ overlayClassName, ...props }: TooltipProps) => {
  const overlayClass = clsx(overlayClassName, styles.appTooltip);
  return <Tooltip overlayClassName={overlayClass} {...props} />;
};
