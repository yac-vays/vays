import { createContext, useContext, useState } from 'react';

/**
 * Lets a page render its title and action buttons into the shared top bar
 * (`Header`). The header exposes two DOM "slots"; pages portal their content into
 * them via `PageHeaderTitle`. Holding the slot elements (set once) in context —
 * rather than the content itself — keeps page re-renders flowing through the
 * portal naturally, with no extra state syncing.
 */
interface HeaderSlots {
  titleEl: HTMLElement | null;
  actionsEl: HTMLElement | null;
  setTitleEl: (el: HTMLElement | null) => void;
  setActionsEl: (el: HTMLElement | null) => void;
}

const HeaderSlotsContext = createContext<HeaderSlots>({
  titleEl: null,
  actionsEl: null,
  setTitleEl: () => {},
  setActionsEl: () => {},
});

export const HeaderSlotsProvider = ({ children }: { children: React.ReactNode }) => {
  const [titleEl, setTitleEl] = useState<HTMLElement | null>(null);
  const [actionsEl, setActionsEl] = useState<HTMLElement | null>(null);
  return (
    <HeaderSlotsContext.Provider value={{ titleEl, actionsEl, setTitleEl, setActionsEl }}>
      {children}
    </HeaderSlotsContext.Provider>
  );
};

export const useHeaderSlots = () => useContext(HeaderSlotsContext);
