/**
 * The shared look of the icon buttons in the overview table (the 'Actions' and
 * 'Links' columns).
 */

// Color transform over to gray from any svg
// https://stackoverflow.com/questions/42966641/how-to-transform-black-into-any-given-color-using-only-css-filters/43960991#43960991
// https://codepen.io/sosuke/pen/Pjoqqp
const GREY_FILTER =
  'brightness(0) saturate(100%) invert(42%) sepia(24%) saturate(434%) hue-rotate(176deg) brightness(99%) contrast(85%)';

/** @param isLeft whether the button is the very left one of its row */
export function iconButtonClassName(isLeft: boolean): string {
  return `p-1 inline-flex items-center justify-center text-center gap-2.5 font-medium bg-[#f5f5f5] dark:bg-meta-4  border-transparent
             ${isLeft ? 'rounded-l' : ''}`;
}

export const ICON_BUTTON_STYLE = {
  position: 'relative' as const,
  left: -1,
  zIndex: 1,
  height: 36,
  width: 36,
  cursor: 'pointer',
};

/**
 * @param icon an SVG image (as string)
 * @param enabled whether the button can be used (otherwise it is faded out)
 */
const IconButtonImage = ({
  icon,
  title,
  enabled,
}: {
  icon: string;
  title: string;
  enabled: boolean;
}) => (
  <div
    className={`rounded duration-300 hover:border-black hover:bg-transparent ${
      enabled ? 'hover:scale-150' : ''
    }`}
    style={{ width: '100%' }}
  >
    {/* https://stackoverflow.com/questions/44900569/turning-an-svg-string-into-an-image-in-a-react-component */}
    <img
      title={title}
      style={{
        height: 30,
        width: 30,
        backgroundColor: 'rgba(0 0 0/0)',
        filter: GREY_FILTER,
        opacity: enabled ? 1 : 0.2,
      }}
      src={`data:image/svg+xml;utf8,${encodeURIComponent(icon)}`}
    />
  </div>
);

export default IconButtonImage;
