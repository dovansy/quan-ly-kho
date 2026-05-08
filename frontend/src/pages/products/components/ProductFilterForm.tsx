import { Form, FormInstance } from 'antd';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppSelect } from '@/components/atoms/AppSelect';
import { FilterSection } from '@/components/organisms/filter-section';
import { statusOptions } from '@/constants/options';

interface Props {
  form: FormInstance;
  loading?: boolean;
  categoryOpts: { label: string; value: string }[];
  productNameOpts: { label: string; value: string }[];
  onSearch: (values: any) => void;
  onClear: () => void;
}

export const ProductFilterForm = ({ form, loading, categoryOpts, productNameOpts, onSearch, onClear }: Props) => (
  <FilterSection form={form} onSearch={onSearch} onClear={onClear} loading={loading}>
    <Form.Item name="keyword" label="Tìm kiếm" className="flex-1 mb-0">
      <AppAutoComplete
        placeholder="Tên sản phẩm..."
        options={productNameOpts}
        filterOption={(i, o) =>
          ((o?.label as string) ?? '').toLowerCase().includes(i.toLowerCase())
        }
      />
    </Form.Item>
    <Form.Item name="category" label="Loại" className="w-[200px] mb-0">
      <AppSelect
        allowClear
        showSearch
        placeholder="Chọn loại"
        options={categoryOpts}
        filterOption={(i, o) => (o?.label ?? '').toString().toLowerCase().includes(i.toLowerCase())}
      />
    </Form.Item>
    <Form.Item name="status" label="Trạng thái" className="w-[200px] mb-0">
      <AppSelect allowClear placeholder="Chọn trạng thái" options={statusOptions} />
    </Form.Item>
  </FilterSection>
);
