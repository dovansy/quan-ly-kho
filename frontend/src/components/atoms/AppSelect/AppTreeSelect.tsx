'use client';

import { forwardRef, useEffect, useState } from 'react';

import { Checkbox, TreeSelect, TreeSelectProps } from 'antd';
import clsx from 'clsx';

import styles from './styles/AppSelect.module.scss';
import './styles/AppSelect.scss';

export interface AppTreeSelectProps extends TreeSelectProps {}

export const AppTreeSelect = forwardRef<HTMLSelectElement, AppTreeSelectProps>(
  (
    {
      placeholder = 'Select',
      size = 'middle',
      maxTagCount = 2,
      className,
      treeData = [],
      ...props
    }: AppTreeSelectProps,
    _ref
  ) => {
    const [selectedValues, setSelectedValues] = useState([]);
    const [options, setOptions] = useState<any>([]);
    const [allIds, setAllIds] = useState<any>([]);

    useEffect(() => {
      const options = treeData?.map(option => ({
        title: option.label,
        value: option.value,
        label: option.label,
        disabled: option.disabled,
        disableCheckbox: option.disableCheckbox,
      }));

      const allIds = options?.filter(option => option.disabled !== true)?.map(({ value }) => value);

      setAllIds(allIds);
      setOptions(options);
    }, [treeData]);

    const classNames = clsx(className, styles.appSelect, styles[size]);

    return (
      <TreeSelect
        {...props}
        size={size}
        treeCheckable={true}
        placeholder={placeholder}
        allowClear={true}
        onChange={ids => setSelectedValues(ids)}
        value={selectedValues}
        maxTagCount={maxTagCount}
        className={classNames}
        maxTagPlaceholder={omittedValues => `+ ${omittedValues.length} Options ...`}
        treeData={[
          {
            title: (
              <div className="option-select-all">
                {selectedValues.length ===
                options.filter((option: any) => option.disabled !== true).length ? (
                  <Checkbox checked={true} onClick={() => setSelectedValues([])}>
                    <span className="cursor-pointer text-select">Unselect all</span>
                  </Checkbox>
                ) : (
                  <Checkbox checked={false} onClick={() => setSelectedValues(allIds)}>
                    <span className="cursor-pointer text-select">Select all</span>
                  </Checkbox>
                )}
                <div className="absolute hr-decoration mt-[6px] w-full"></div>
              </div>
            ),
            value: 'xxx',
            disableCheckbox: true,
            disabled: true,
            checkable: true,
          },
          ...options,
        ]}
      />
    );
  }
);

AppTreeSelect.displayName = 'AppTreeSelect';
