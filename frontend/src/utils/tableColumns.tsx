export const sttColumn = {
  title: 'STT',
  dataIndex: 'index',
  key: 'index',
  width: 60,
  align: 'center' as const,
  render: (_: any, __: any, index: number) => index + 1,
};
