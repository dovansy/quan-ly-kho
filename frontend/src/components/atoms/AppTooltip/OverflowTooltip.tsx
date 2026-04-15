import { TooltipProps } from 'antd';
import clsx from 'clsx';
import { MouseEvent, useCallback, useState } from 'react';
import { AppTooltip } from '.';

const OverflowTooltip = ({ children, className, ...props }: TooltipProps) => {
  const [tooltipEnabled, setTooltipEnabled] = useState<boolean | undefined>(false);

  const handleShouldShow = useCallback(({ currentTarget }: MouseEvent<Element>) => {
    setTooltipEnabled(currentTarget.scrollWidth > currentTarget.clientWidth ? true : false);
  }, []);

  const handleHide = useCallback(() => setTooltipEnabled(false), []);

  return (
    <AppTooltip {...props} open={tooltipEnabled}>
      <div
        onMouseEnter={handleShouldShow}
        onMouseLeave={handleHide}
        className={clsx(`text-ellipsis block`, className)}
      >
        {children}
      </div>
    </AppTooltip>
  );
};

export default OverflowTooltip;
