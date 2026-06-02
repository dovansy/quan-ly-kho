import { Form, FormInstance } from 'antd';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppSelect } from '@/components/atoms/AppSelect';
import { FilterSection } from '@/components/organisms/filter-section';
import { DATE_FORMAT } from '@/constants/format';
import { paymentStatusOptions } from '@/constants/options';

interface Props {
  form: FormInstance;
  loading?: boolean;
  brokerOptions: { label: string; value: string }[];
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const SalesReportFilterForm = ({
  form,
  loading,
  brokerOptions,
  onSearch,
  onClear,
}: Props) => {
  const fromDate = Form.useWatch('fromDate', form);
  const toDate = Form.useWatch('toDate', form);

  return (
    <FilterSection form={form} onSearch={onSearch} onClear={onClear} loading={loading}>
      <Form.Item
        name="brokerName"
        label="Tên nhà môi giới/ khách hàng(bán lẻ)"
        className="flex-1 mb-0"
      >
        <AppAutoComplete
          allowClear
          placeholder="Nhập hoặc chọn NMG, khách hàng(bán lẻ)"
          options={brokerOptions}
          filterOption={(input, option) =>
            ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
          }
        />
      </Form.Item>
      <Form.Item name="fromDate" label="Từ ngày" className="flex-1 mb-0">
        <AppDatePicker
          allowClear
          placeholder="Chọn từ ngày"
          format={DATE_FORMAT.DISPLAY}
          className="w-full"
          disabledDate={current => !!toDate && current.isAfter(toDate, 'day')}
        />
      </Form.Item>
      <Form.Item name="toDate" label="Đến ngày" className="flex-1 mb-0">
        <AppDatePicker
          allowClear
          placeholder="Chọn đến ngày"
          format={DATE_FORMAT.DISPLAY}
          className="w-full"
          disabledDate={current => !!fromDate && current.isBefore(fromDate, 'day')}
        />
      </Form.Item>
      <Form.Item name="payment_status" label="Trạng thái" className="flex-1 mb-0">
        <AppSelect allowClear placeholder="Chọn trạng thái" options={paymentStatusOptions} />
      </Form.Item>
    </FilterSection>
  );
};
