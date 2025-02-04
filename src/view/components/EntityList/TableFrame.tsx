const TableFrame = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="rounded-sm border border-stroke bg-white shadow-default py-2 dark:bg-boxdark">
      {/* Must do two seperate divs to make sure the border is showing properly when scrolling... */}
      <div
        style={{
          top: 10,
          left: 10,
          right: 10,
          bottom: 10,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            paddingLeft: 10,
            paddingRight: 10,
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
};

export default TableFrame;
