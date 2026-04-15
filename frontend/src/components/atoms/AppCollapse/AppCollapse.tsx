import { CollapseProps, Collapse } from 'antd';
import clsx from 'clsx';
import styles from './AppCollapse.module.scss';

export const AppCollapse = ({ className, ...props }: CollapseProps) => {
  const classNames = clsx(className, styles.appCheckbox);

  return (
    <Collapse
      {...props}
      className={classNames}
      expandIcon={({ isActive }) => (isActive ? '<' : '>')}
      expandIconPosition="end"
    />
  );
};
