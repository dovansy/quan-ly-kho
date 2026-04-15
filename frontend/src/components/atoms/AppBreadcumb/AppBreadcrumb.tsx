import { useMemo } from 'react';

import { Breadcrumb, BreadcrumbProps } from 'antd';
import clsx from 'clsx';

export const AppBreadcrumb = ({ items, className, ...props }: BreadcrumbProps) => {
  const displayItems = useMemo(() => {
    return items?.map((item, index) => {
      const className = clsx(item.className, 'text-base', {
        'text-gray-6': index < items.length - 1,
        'text-gray-2': index >= items.length - 1,
      });

      return {
        ...item,
        className,
      };
    });
  }, [items]);

  return (
    <Breadcrumb
      className={clsx(className, '[&>ol>li.ant-breadcrumb-separator]:mx-0')}
      items={displayItems}
      // separator={<RightIcon />}
      {...props}
    />
  );
};
