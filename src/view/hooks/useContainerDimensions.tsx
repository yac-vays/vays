import { useEffect, useState } from 'react';

/**
 * @param divRef The reference of the div container whose size should be returned as variable.
 * @returns A variable that is an object with keys `width` and `height`
 *          that update with resizing of the div.
 * @credit https://stackoverflow.com/questions/43817118/how-to-get-the-width-of-a-react-element
 */
export const useContainerDimensions = (
  divRef: React.RefObject<HTMLDivElement>,
  startWidth: number = 0,
  startHeight: number = 0,
) => {
  const [dimensions, setDimensions] = useState<{ [key: string]: number | undefined }>({
    width: startWidth,
    height: startHeight,
  });

  useEffect(() => {
    const getDimensions = () => ({
      width: divRef.current?.offsetWidth,
      height: divRef.current?.offsetHeight,
    });

    const handleResize = () => {
      setDimensions(getDimensions());
    };

    if (divRef.current) {
      setDimensions(getDimensions());
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [divRef]);

  return dimensions;
};
