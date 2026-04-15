import './index.scss';

const AppLoading = ({ className }: { className?: string }) => {
  return (
    <div className={`lds-ring ${className ?? ''}`}>
      <div />
      <div />
      <div />
      <div />
    </div>
  );
};

export default AppLoading;
