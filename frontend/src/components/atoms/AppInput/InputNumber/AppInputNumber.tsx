import { InputProps } from 'antd';
import { NumericFormat, NumericFormatProps } from 'react-number-format';

import { AppInput } from '..';

interface AppInputNumberProps extends Omit<NumericFormatProps<InputProps>, 'onChange'> {
  onChange?: (data: number | string) => void;
  fixedDecimal?: boolean;
  hideThousandSeparator?: boolean;
}

export const AppInputNumber = ({
  onChange,
  onValueChange,
  decimalScale = 2,
  hideThousandSeparator,
  ...props
}: AppInputNumberProps) => {
  return (
    <NumericFormat
      thousandSeparator={hideThousandSeparator ? '' : ','}
      decimalScale={decimalScale}
      decimalSeparator="."
      allowLeadingZeros
      onKeyDown={(e: any) => {
        // keyCode "-" = 189 || 109
        if (e.keyCode === 189 || e.keyCode === 109) {
          e.preventDefault();
        }
      }}
      onValueChange={(value, source) => {
        onChange?.(value.value);
        onValueChange?.(value, source);
      }}
      {...props}
      customInput={AppInput}
    />
  );
};
