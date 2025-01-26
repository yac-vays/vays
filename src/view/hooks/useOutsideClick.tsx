// Actually, this is redundant to thirdparty-based-components/OutsideClick
import { useEffect } from 'react';

function useOutsideClick(ref: React.MutableRefObject<any>, callback: () => void) {
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, callback]);
}

export default useOutsideClick;
