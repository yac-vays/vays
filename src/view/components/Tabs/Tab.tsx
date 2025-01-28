interface TabProps {
  index: number;
  label?: string;
  currentTab: number;
  onClick: (_event: any, value: number) => void;
}

const Tab = ({ index, label, currentTab, onClick }: TabProps) => {
  return (
    <>
      <a
        className={`rounded-t-xl duration-300 cursor-pointer py-4 px-2 text-md font-medium hover:text-primary dark:hover:text-white md:text-base ${
          index == currentTab
            ? 'border-primary text-plainfont border-b-2 bg-primary-5'
            : 'border-transparent border-b-2 hover:translate-y-[-10px] opacity-70 hover:opacity-100'
        }`}
        onClick={(e) => onClick(e, index)}
      >
        {label}
      </a>
    </>
  );
};

export default Tab;
