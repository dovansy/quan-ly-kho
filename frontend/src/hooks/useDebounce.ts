import { useEffect, useState } from 'react';

function useDebounce(value: any, delay: number = 500, callback?: () => void) {
  const [valueInput, setValueInput] = useState(value);

  useEffect(() => {
    const timerId = setTimeout(() => {
      setValueInput(value);
      callback?.();
    }, delay);

    return () => {
      clearTimeout(timerId);
    };
  }, [value, delay, callback]);

  return valueInput;
}

export default useDebounce;
