import { LinkDecl } from '../../../utils/types/api';
import IconButtonImage, { ICON_BUTTON_STYLE, iconButtonClassName } from './IconButtonImage';

interface LinkButtonProps {
  link: LinkDecl;
  /** The URL for this entity, or undefined if the link does not apply to it. */
  url: string | undefined;
  isLeft: boolean;
}

/**
 * An external link of an entity, looking like an action button. A link that
 * does not apply to the entity is shown faded out (like a disallowed action),
 * so the icons stay aligned across rows.
 */
const LinkButton = ({ link, url, isLeft }: LinkButtonProps) => {
  const className = iconButtonClassName(isLeft);
  if (url == undefined) {
    return (
      <div className={className} style={{ ...ICON_BUTTON_STYLE, cursor: 'default' }}>
        <IconButtonImage icon={link.icon} title={`${link.title} (not available)`} enabled={false} />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{ ...ICON_BUTTON_STYLE, textDecoration: 'none' }}
    >
      <IconButtonImage icon={link.icon} title={link.title} enabled={true} />
    </a>
  );
};

export default LinkButton;
