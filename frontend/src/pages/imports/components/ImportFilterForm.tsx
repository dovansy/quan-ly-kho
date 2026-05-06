import { Form, FormInstance } from 'antd';
import { FiSearch } from 'react-icons/fi';
import { AppDatePicker } from '@/components/atoms/AppDatepicker';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { FilterSection } from '@/components/organisms/filter-section';
import { DATE_FORMAT } from '@/constants/format';

interface Props {
  form: FormInstance;
  loading?: boolean;
  warehouseOptions: { label: string; value: number }[];
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const ImportFilterForm = ({
  form,
  loading,
  warehouseOptions,
  onSearch,
  onClear,
}: Props) => (
  <FilterSection form={form} onSearch={onSearch} onClear={onClear} loading={loading}>
    <Form.Item name="keyword" label="Tìm SP" className="flex-1 mb-0">
      <AppInput placeholder="Tên sản phẩm..." prefix={<FiSearch />} />
    </Form.Item>
    <Form.Item name="warehouse_id" label="Kho" className="w-[200px] mb-0">
      <AppSelect
        allowClear
        showSearch
        placeholder="Chọn kho"
        options={warehouseOptions}
        filterOption={(i, o) =>
          (o?.label ?? '').toString().toLowerCase().includes(i.toLowerCase())
        }
      />
    </Form.Item>
    <Form.Item name="batch" label="Lô" className="w-[180px] mb-0">
      <AppInput placeholder="Mã lô" />
    </Form.Item>
    <Form.Item name="importDate" label="Ngày nhập" className="w-[180px] mb-0">
      <AppDatePicker
        allowClear
        placeholder="Chọn ngày"
        format={DATE_FORMAT.DISPLAY}
        className="w-full"
      />
    </Form.Item>
  </FilterSection>
);
