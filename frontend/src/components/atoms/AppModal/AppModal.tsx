import { Modal, ModalProps } from 'antd';
import clsx from 'clsx';

import styles from './AppModal.module.scss';

export const AppModal = ({ wrapClassName, children, ...props }: ModalProps) => {
  const wrapClassNames = clsx(wrapClassName, styles.appModal);

  return (
    <Modal
      maskClosable={false}
      wrapClassName={wrapClassNames}
      // closeIcon={<Close />}
      footer={null}
      {...props}
    >
      {children}
    </Modal>
  );
};
