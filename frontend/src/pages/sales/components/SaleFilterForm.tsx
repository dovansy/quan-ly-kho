import { Form, FormInstance } from 'antd';
import { FiSearch } from 'react-icons/fi';
import { AppAutoComplete, AppAutoCompleteOption } from '@/components/atoms/AppAutoComplete';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { FilterSection } from '@/components/organisms/filter-section';
import { DATE_FORMAT } from '@/constants/format';
import { paymentStatusOptions } from '@/constants/options';

interface Props {
  form: FormInstance;
  loading?: boolean;
  productOptions: AppAutoCompleteOption[];
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const SaleFilterForm = ({ form, loading, productOptions, onSearch, onClear }: Props) => (
  <FilterSection form={form} onSearch={onSearch} onClear={onClear} loading={loading}>
    <Form.Item name="keyword" label="Tìm khách hàng" className="flex-1 mb-0">
      <AppInput placeholder="Tên KH hoặc tên đơn hàng..." prefix={<FiSearch />} />
    </Form.Item>
    <Form.Item name="productKeyword" label="Tìm sản phẩm" className="flex-1 mb-0">
      <AppAutoComplete placeholder="Nhập tên sản phẩm..." options={productOptions} />
    </Form.Item>
    <Form.Item name="payment_status" label="Trạng thái" className="flex-1 mb-0">
      <AppSelect allowClear placeholder="Chọn trạng thái" options={paymentStatusOptions} />
    </Form.Item>
    <Form.Item name="saleDate" label="Ngày bán" className="flex-1 mb-0">
      <AppDatePicker placeholder="Chọn ngày" format={DATE_FORMAT.DISPLAY} className="w-full" />
    </Form.Item>
  </FilterSection>
);
