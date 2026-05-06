import { Col, Form, Row } from 'antd';
import { useEffect } from 'react';
import { AppAutoComplete } from '@/components/atoms/AppAutoComplete';
import { AppInput } from '@/components/atoms/AppInput';
import { AppSelect } from '@/components/atoms/AppSelect';
import { CrudModal } from '@/components/organisms/crud-modal';
import { useAppNotification } from '@/components/templates/notification';
import { statusOptions } from '@/constants/options';
import { useUpdateProduct } from '@/hooks/api/products';
import { ProductRow } from '../types';

interface Props {
  open: boolean;
  editing: ProductRow | null;
  categoryOpts: { label: string; value: string }[];
  smallUnitOpts: { label: string; value: number }[];
  onClose: () => void;
}

export const ProductFormModal = ({
  open,
  editing,
  categoryOpts,
  smallUnitOpts,
  onClose,
}: Props) => {
  const [form] = Form.useForm();
  const update = useUpdateProduct();
  const { success, error } = useAppNotification();

  useEffect(() => {
    if (!open || !editing) return;
    form.setFieldsValue({
      category: editing.category,
      supplier: editing.supplier,
      default_small_unit_id: editing.default_small_unit_id,
      status: editing.status,
    });
  }, [open, editing, form]);

  const close = () => {
    form.resetFields();
    onClose();
  };

  const onSubmit = () => {
    if (!editing) return;
    form.validateFields().then(values => {
      update.mutate(
        {
          id: editing.id,
          data: {
            category: values.category,
            supplier: values.supplier || null,
            default_small_unit_id: Number(values.default_small_unit_id),
            status: values.status,
          },
        },
        {
          onSuccess: () => {
            success({ message: 'Cập nhật SP thành công' });
            close();
          },
          onError: (e: any) =>
            error({ message: 'Lỗi cập nhật', description: e?.response?.data?.message }),
        }
      );
    });
  };

  return (
    <CrudModal
      open={open}
      title={`Chỉnh sửa: ${editing?.name || ''}`}
      onCancel={close}
      onSubmit={onSubmit}
      submitLabel="Cập nhật"
      loading={update.isPending}
    >
      <Form form={form} layout="vertical" className="pt-4" autoComplete="off">
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item name="category" label="Loại sản phẩm">
              <AppAutoComplete placeholder="Nhập hoặc chọn loại" options={categoryOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="supplier" label="Nhà cung cấp">
              <AppInput placeholder="Tên NCC" />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="default_small_unit_id"
              label="Đơn vị lẻ mặc định"
              rules={[{ required: true }]}
            >
              <AppSelect placeholder="Chọn đơn vị" options={smallUnitOpts} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <AppSelect options={statusOptions} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </CrudModal>
  );
};
