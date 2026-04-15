import React from 'react';
import { TablePaginationConfig } from 'antd';
import clsx from 'clsx';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import styles from './AppTable.module.scss';

const PrevIcon = React.createElement(FiChevronLeft, { size: 18 });
const NextIcon = React.createElement(FiChevronRight, { size: 18 });

export const getPaginationClass = (className?: string): string =>
  clsx(
    className,
    styles.appPagination,
    '[&>li.ant-pagination-item>a]:text-sm [&>li.ant-pagination-item.ant-pagination-item-active>a]:font-bold',
    '[&>li.ant-pagination-jump-next_div.ant-pagination-item-container_span.ant-pagination-item-ellipsis]:text-main',
    '[&>li.ant-pagination-jump-prev_div.ant-pagination-item-container_span.ant-pagination-item-ellipsis]:text-main'
  );

export const getDefaultPaginationOptions: (className?: string) => TablePaginationConfig = (
  className?: string
) => {
  return {
    className: getPaginationClass(className),
    nextIcon: NextIcon,
    prevIcon: PrevIcon,
    hideOnSinglePage: true,
    showSizeChanger: false,
  };
};
