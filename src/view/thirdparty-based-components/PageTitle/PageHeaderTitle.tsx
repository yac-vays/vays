interface PageHeaderTitleProps {
  title: string;
  subText: string;
  children?: React.ReactNode;
}

const PageHeaderTitle = ({ title, subText, children }: PageHeaderTitleProps) => {
  return (
    <>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex flex-row" style={{ marginLeft: 0 }}>
            <h2 className="mb-1.5 text-title-md2 font-bold text-black dark:text-white">{title}</h2>
          </div>
          <p className="md:text-title-sm sm:text-medium" style={{ whiteSpace: 'pre-wrap' }}>
            {subText}
          </p>
        </div>
        <div className="relative flex">{children}</div>
      </div>
    </>
  );
};

export default PageHeaderTitle;
