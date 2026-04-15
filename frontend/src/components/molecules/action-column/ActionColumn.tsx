import { AppButton } from '@/components/atoms/AppButton';
import { Popconfirm, Space } from 'antd';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';

interface ActionColumnProps {
  onEdit: () => void;
  onDelete?: () => void;
  deleteTitle?: string;
  deleteDescription?: string;
  showDelete?: boolean;
}

export const ActionColumn = ({
  onEdit,
  onDelete,
  deleteTitle = 'Xác nhận xóa',
  deleteDescription = 'Bạn có chắc chắn muốn xóa?',
  showDelete = true,
}: ActionColumnProps) => {
  return (
    <Space>
      <AppButton type="text" color="blue" icon={<FiEdit2 />} onClick={onEdit} />
      {showDelete && onDelete && (
        <Popconfirm
          title={deleteTitle}
          description={deleteDescription}
          onConfirm={onDelete}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
        >
          <AppButton type="text" color="red" icon={<FiTrash2 />} />
        </Popconfirm>
      )}
    </Space>
  );
};
