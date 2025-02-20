import { useEffect } from 'react';
import { useCollapse } from 'react-collapsed';

function Accordion(props: {
  title: string;
  children: React.ReactNode;
  reduced?: boolean;
  expanded?: boolean;
}) {
  const { getCollapseProps, getToggleProps, isExpanded, setExpanded } = useCollapse({
    defaultExpanded: props.expanded ?? false,
  });

  useEffect(() => {
    setExpanded(props.expanded ?? false);
  }, [props.expanded ?? false]);

  return (
    <>
      <div className={`overflow-hidden w-full`}>
        <div {...getToggleProps()}>
          {/* React-collapsed does not like padding on the trigger element... */}
          <div className="pt-4">
            <div
              className={`flex items-center justify-between border-b border-[#c9c9c9] pb-4 cursor-pointer ${
                props.reduced ? 'h-5' : 'h-10'
              }`}
              title={(isExpanded ? 'Collapse ' : 'Expand ') + props.title}
            >
              <h4 className={`text-plainfont ${props.reduced ? 'text-md' : 'text-xl'}`}>
                {props.title}
              </h4>
              <div className={`duration-500 ${isExpanded ? '' : 'rotate-180'}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  className="fill-plainfont"
                >
                  <path d="M480-528 296-344l-56-56 240-240 240 240-56 56-184-184Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <p {...getCollapseProps()}>{props.children}</p>
      </div>
    </>
  );
}

export default Accordion;
