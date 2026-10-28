import { useState } from 'react';
import { GUIActionButtonArg } from '../../../utils/types/internal/actions';
import { isModifiedClick } from '../../../utils/navClick';
import IconButtonImage, { ICON_BUTTON_STYLE, iconButtonClassName } from './IconButtonImage';

interface ActionButtonProps {
  actArgs: GUIActionButtonArg;
  isLeft: boolean;
}

/**
 * @param actArgs the arguments for this specific action
 * @param isLeft whether this action is to the very left of the action row.
 * @returns
 */
const ActionButton = ({ actArgs, isLeft }: ActionButtonProps) => {
  const [isSending, setSending] = useState<boolean>(false);
  const action = actArgs.action;

  const activate = () => {
    if (actArgs.isAllowed) {
      if (action.dangerous) {
        actArgs.performAction();
      } else {
        setSending(true);
        actArgs.performAction().then(() => {
          setSending(false);
        });
      }
    }
  };

  // Navigating actions (edit/view) render as real links so they can be opened in
  // a new tab; a plain left-click is intercepted for in-app navigation, while
  // modified/middle clicks keep their native "open in new tab" behaviour.
  const asLink = actArgs.href != null && actArgs.isAllowed;

  const className = iconButtonClassName(isLeft);
  const style = ICON_BUTTON_STYLE;

  const content = isSending ? (
    <div
      style={{ borderWidth: 3 }}
      className="absolute h-4 w-4 animate-spin rounded-full border-2 border-solid border-grey border-t-transparent ml-1 mt-0 pt-0"
    ></div>
  ) : (
    <IconButtonImage icon={action.icon} title={action.title} enabled={actArgs.isAllowed} />
  );

  return (
    <>
      {asLink ? (
        <a
          href={actArgs.href}
          onClick={(e) => {
            if (isModifiedClick(e)) return;
            e.preventDefault();
            activate();
          }}
          className={className}
          style={{ ...style, textDecoration: 'none' }}
        >
          {content}
        </a>
      ) : (
        <div onClick={activate} className={className} style={style}>
          {content}
        </div>
      )}
    </>
  );
};

export default ActionButton;
