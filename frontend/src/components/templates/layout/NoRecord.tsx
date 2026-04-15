import clsx from 'clsx';

interface NoRecordLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'no-data' | 'no-record';
}

export const NoRecordLayout = ({ type = 'no-data', className, ...props }: NoRecordLayoutProps) => {
  return (
    <div className={clsx(className, 'flex flex-col items-center justify-center')} {...props}>
      {type === 'no-data' ? <span>No Data</span> : <span>No Data</span>}
      <p className="mt-4 text-body-2">{type === 'no-data' ? 'No data' : 'No record found'}</p>
    </div>
  );
};
