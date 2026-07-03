import Popover from '../Popover';

/**
 * Click-toggled panel for rich content (the overview table's log panels). A
 * thin wrapper over {@link Popover} with a larger preferred size; placement,
 * viewport fitting, dismissal and the small-screen bottom sheet all come from
 * the primitive.
 */
const RichInfoPanel = ({
  children,
  anchor,
}: {
  children: React.ReactNode;
  anchor: React.ReactNode;
}) => {
  return (
    <Popover anchor={anchor} placement="right" maxWidth={640} maxHeight={500} role="dialog">
      {children}
    </Popover>
  );
};

export default RichInfoPanel;
