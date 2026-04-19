import { AppButton } from '@/components/atoms/AppButton';
import { AppModal } from '@/components/atoms/AppModal';
import { ReactNode } from 'react';

interface CrudModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  width?: number;
  children: ReactNode;
}

export const CrudModal = ({
  open,
  title,
  onCancel,
  onSubmit,
  submitLabel = 'Thêm mới',
  loading = false,
  width = 600,
  children,
}: CrudModalProps) => {
  return (
    <AppModal
      open={open}
      title={title}
      onCancel={onCancel}
      width={width}
      footer={
        <div className="flex justify-end gap-3 pt-2">
          <AppButton type="default" onClick={onCancel} disabled={loading}>
            Hủy
          </AppButton>
          <AppButton type="primary" onClick={onSubmit} loading={loading}>
            {submitLabel}
          </AppButton>
        </div>
      }
    >
      {children}
    </AppModal>
  );
};
