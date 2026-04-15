import { AutoComplete, AutoCompleteProps } from 'antd';
import clsx from 'clsx';
import { forwardRef, useMemo } from 'react';
import styles from './styles/AppAutoComplete.module.scss';

export interface AppAutoCompleteOption {
  label: string;
  value: string;
}

export interface AppAutoCompleteProps extends Omit<AutoCompleteProps, 'options'> {
  options?: AppAutoCompleteOption[];
}

/**
 * Select kết hợp tìm kiếm + nhập tay giá trị mới.
 *
 * - Gõ → filter dropdown gợi ý từ `options`
 * - Chọn từ dropdown → dùng giá trị có sẵn
 * - Gõ giá trị mới không có trong list → dùng luôn giá trị đó
 */
export const AppAutoComplete = forwardRef<any, AppAutoCompleteProps>(
  ({ placeholder = 'Nhập hoặc chọn...', className, options = [], ...props }, ref) => {
    const autoOptions = useMemo(
      () => options.map(o => ({ value: o.value, label: o.label })),
      [options],
    );

    return (
      <AutoComplete
        ref={ref}
        placeholder={placeholder}
        className={clsx(className, styles.appAutoComplete)}
        options={autoOptions}
        filterOption={(input, option) =>
          (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
        }
        allowClear
        {...props}
      />
    );
  },
);

AppAutoComplete.displayName = 'AppAutoComplete';
