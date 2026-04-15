import { useMemo } from 'react';

import { Form } from 'antd';
import { FormItemProps } from 'antd/es/form/FormItem';
import clsx from 'clsx';

import styles from './AppFormItem.module.scss';

interface AppFormItemProps extends FormItemProps {
  labelSize?: 'small' | 'medium' | 'large';
}

interface FormItemLabelProps {
  label: React.ReactNode;
  labelSize?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FormItemLabel = ({ label, labelSize = 'medium', className }: FormItemLabelProps) => {
  return (
    <label
      className={clsx(styles.formLabel, className, 'font-bold', {
        [styles.labelSmall]: labelSize === 'small',
        [styles.labelLarge]: labelSize === 'large',
      })}
    >
      {label}
    </label>
  );
};

export const AppFormItem = ({
  className,
  label,
  labelSize = 'medium',
  ...props
}: AppFormItemProps) => {
  const classNames = clsx(styles.formItem, className);

  const internalLabel = useMemo(() => {
    if (typeof label !== 'string') return label;

    return <FormItemLabel label={label} labelSize={labelSize} />;
  }, [label, labelSize]);

  return <Form.Item className={classNames} label={internalLabel} {...props} />;
};
