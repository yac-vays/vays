import Accordion from '../../components/Accordion/Accordion';

export interface TroubleShootMessageProps {
  priority: number;
  title: string;
  subtitle: string;
  affectedKeys: string[][];
}

/**
 * Schema Warning Message. The element is incorporated by the header element.
 *
 * @param priority a number between 1 and 10 with higher being more critical
 * @returns
 */
const SchemaWarningMessage = ({
  priority,
  title,
  subtitle,
  affectedKeys,
}: TroubleShootMessageProps) => {
  let color = 'lime-300';
  if (priority >= 9) {
    color = 'red-500';
  } else if (priority >= 6) {
    color = 'orange-500';
  } else if (priority >= 3) {
    color = 'yellow-300';
  }
  return (
    <div className={`border-l-8 border-${color}`}>
      <div className="flex flex-col gap-2.5 border-t border-stroke px-4.5 py-3 hover:bg-primary-2 dark:hover:bg-meta-4">
        <p className="text-sm">
          <span className=" font-bold text-plainfont">{title}</span> {subtitle}
          <Accordion
            title="Show affected keys"
            reduced
            expanded={affectedKeys.length > 10 ? false : true}
          >
            <ul className="border rounded border-[#0000044] mt-1 p-0.5">
              {(() => {
                const jsx = [];
                for (const key of affectedKeys) {
                  jsx.push(
                    <li>
                      <div>
                        - <b>{key[0]}</b> in <b>{key[1]}</b>
                      </div>
                    </li>,
                  );
                }
                return jsx;
              })()}
            </ul>
          </Accordion>
        </p>

        <p className="text-xs">Priority {priority}</p>
      </div>
    </div>
  );
};

export default SchemaWarningMessage;
