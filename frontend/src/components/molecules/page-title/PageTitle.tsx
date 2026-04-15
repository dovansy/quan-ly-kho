import './PageTitle.scss';

interface Props {
  title: string;
}

const PageTitle = ({ title }: Props) => {
  return (
    <div className="main-content-heading">
      <h1 className="relative font-bold">{title}</h1>
    </div>
  );
};

export default PageTitle;
