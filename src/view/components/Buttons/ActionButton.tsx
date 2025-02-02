import { useState } from 'react';
import { GUIActionButtonArg } from '../../../utils/types/internal/actions';
import { RequestContext } from '../../../utils/types/internal/request';

interface ActionButtonProps {
  actArgs: GUIActionButtonArg;
  isLeft: boolean;
  alertEnableCallback: (
    title: string,
    text: string,
    verb: string,
    confirm: () => void,
    cancel: () => void,
  ) => void;
  requestContext: RequestContext;
  entityName: string;
}

/**
 * TODO: Use pseudocls for left.
 * @param actArgs the arguments for this specific action
 * @param isLeft whether this action is to the very left of the action row.
 * @param alertEnableCallback DEPRECATED
 * @param requestContext DEPRECATED
 * @param entityName DEPRECATED
 * @returns
 */
const ActionButton = ({
  actArgs,
  isLeft,
  alertEnableCallback,
  requestContext,
  entityName,
}: ActionButtonProps) => {
  const [isSending, setSending] = useState<boolean>(false);
  const red =
    'brightness(0) saturate(100%) invert(52%) sepia(57%) saturate(4337%) hue-rotate(329deg) brightness(99%) contrast(99%)';
  const purple =
    'brightness(0) saturate(100%) invert(9%) sepia(57%) saturate(5132%) hue-rotate(290deg) brightness(128%) contrast(119%)';
  const grey =
    'brightness(0) saturate(100%) invert(42%) sepia(24%) saturate(434%) hue-rotate(176deg) brightness(99%) contrast(85%)';
  const action = actArgs.action;
  return (
    <>
      <div
        onClick={() => {
          if (actArgs.isAllowed) {
            if (action.dangerous) {
              actArgs.performAction();
            } else {
              setSending(true);
              actArgs.performAction().then((_) => {
                setSending(false);
              });
            }
          }
        }}
        className={`p-1 inline-flex items-center justify-center text-center gap-2.5 font-medium bg-[#f5f5f5] dark:bg-meta-4  border-transparent 
             ${isLeft ? 'rounded-l' : ''}`}
        style={{
          position: 'relative',
          left: -1,
          zIndex: 1,
          height: 36,
          width: 36,
          cursor: 'pointer',
        }}
      >
        {isSending ? (
          <div
            style={{ borderWidth: 3 }}
            className="absolute h-4 w-4 animate-spin rounded-full border-2 border-solid border-grey border-t-transparent ml-1 mt-0 pt-0"
          ></div>
        ) : (
          <>
            {/* https://stackoverflow.com/questions/44900569/turning-an-svg-string-into-an-image-in-a-react-component */}
            {/* 
            For the transformation, there is this brilliant commentary and website 
            https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991
            https://codepen.io/sosuke/pen/Pjoqqp 
          */}
            <div
              className={`rounded duration-300 dark:hover:bg-meta-4 hover:border-black hover:bg-transparent ${
                actArgs.isAllowed ? 'hover:scale-150' : ''
              }`}
              style={{ width: '100%' }}
            >
              <img
                title={action.title}
                style={{
                  height: 30,
                  width: 30,
                  backgroundColor: 'rgba(0 0 0/0)',
                  filter: grey,
                  opacity: actArgs.isAllowed ? 1 : 0.2,
                }}
                src={`data:image/svg+xml;utf8,${encodeURIComponent(action.icon)}`}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ActionButton;
