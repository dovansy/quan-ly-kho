import { AppButton } from '@/components/atoms/AppButton';
import { Popconfirm, Space } from 'antd';
import { FiEdit2, FiEye, FiRotateCcw, FiTrash2 } from 'react-icons/fi';

interface ActionColumnProps {
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  onReturn?: () => void;
  editDisabled?: boolean;
  deleteTitle?: string;
  deleteDescription?: string;
  returnTitle?: string;
  returnDescription?: string;
  showDelete?: boolean;
}

export const ActionColumn = ({
  onEdit,
  onView,
  onDelete,
  onReturn,
  editDisabled,
  deleteTitle = 'Xác nhận xóa',
  deleteDescription = 'Bạn có chắc chắn muốn xóa?',
  returnTitle = 'Xác nhận hoàn hàng',
  returnDescription = 'Hoàn lại số lượng vào tồn kho?',
  showDelete = true,
}: ActionColumnProps) => {
  return (
    <Space>
      {onView && <AppButton type="text" color="green" icon={<FiEye />} onClick={onView} />}
      {onEdit && (
        <AppButton
          type="text"
          color="blue"
          icon={<FiEdit2 />}
          onClick={onEdit}
          disabled={editDisabled}
        />
      )}
      {onReturn && (
        <Popconfirm
          title={returnTitle}
          description={returnDescription}
          onConfirm={onReturn}
          okText="Hoàn hàng"
          cancelText="Hủy"
        >
          <AppButton type="text" color="yellow" icon={<FiRotateCcw />} />
        </Popconfirm>
      )}
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
