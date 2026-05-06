import clsx from 'clsx';

interface NoRecordLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'no-data' | 'no-record';
}

export const NoRecordLayout = ({ type = 'no-data', className, ...props }: NoRecordLayoutProps) => {
  return (
    <div className={clsx(className, 'flex flex-col items-center justify-center')} {...props}>
      <p className="mt-4 text-body-2">
        {type === 'no-data' ? 'Chưa có dữ liệu' : 'Không tìm thấy bản ghi nào'}
      </p>
    </div>
  );
};
