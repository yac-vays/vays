import { useEffect, useState } from 'react';
import { IDENTITY_EVENT } from '../../model/identity';

/**
 * Re-render the calling component once the backend-resolved user identity
 * arrives (see model/identity), so the `getUser*` getters show it instead of
 * their token-claim fallback.
 */
export const useIdentity = () => {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setVersion((v) => v + 1);
    window.addEventListener(IDENTITY_EVENT, onChange);
    return () => window.removeEventListener(IDENTITY_EVENT, onChange);
  }, []);
};
