import { createContext, useContext } from 'react';

export const PaginationContext = createContext<{ current: number; pageSize: number }>({
  current: 1,
  pageSize: 0,
});

const SttCell = ({ index }: { index: number }) => {
  const { current, pageSize } = useContext(PaginationContext);
  if (!pageSize) return <>{index + 1}</>;
  return <>{(current - 1) * pageSize + index + 1}</>;
};

export const sttColumn = {
  title: 'STT',
  dataIndex: 'index',
  key: 'index',
  width: 60,
  align: 'center' as const,
  render: (_: any, __: any, index: number) => <SttCell index={index} />,
};
