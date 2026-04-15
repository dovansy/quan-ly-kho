import { Pagination, PaginationProps } from 'antd';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

import { getPaginationClass } from './const';

const PrevIcon = <FiChevronLeft size={18} />;
const NextIcon = <FiChevronRight size={18} />;

export const AppPagination = ({
  className,
  showSizeChanger = false,
  ...props
}: PaginationProps) => {
  return (
    <Pagination
      nextIcon={NextIcon}
      prevIcon={PrevIcon}
      className={getPaginationClass(className)}
      showSizeChanger={showSizeChanger}
      {...props}
    />
  );
};
