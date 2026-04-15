interface CountryFlagProps {
  code?: string;
  width: number;
  height: number;
  className?: string;
  alt: string;
}

export const CountryFlag = ({ code, width, height, className, alt }: CountryFlagProps) => {
  if (!code) return <></>;

  return (
    <img
      width={width}
      height={height}
      src={`https://flagcdn.com/${code.toLocaleLowerCase()}.svg`}
      alt={alt}
      className={className}
    />
  );
};
