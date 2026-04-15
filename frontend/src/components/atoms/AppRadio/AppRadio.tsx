import { Radio, RadioProps } from 'antd';
import clsx from 'clsx';
import styles from './AppRadio.module.scss';

export const AppRadio = ({ className, ...props }: RadioProps) => {
  const classNames = clsx(className, styles.appRadio);

  return <Radio className={classNames} {...props} />;
};
