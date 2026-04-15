import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  isTablet: boolean;
  isPhone: boolean;
  isPC: boolean;
}

export default function useWindowSize(): WindowSize {
  const isClient = typeof window !== 'undefined';

  const getWidth = () => (isClient ? window.innerWidth : 1024); // default width for SSR
  const [width, setWidth] = useState<number>(getWidth);

  // Compute device type directly from width
  const isPhone = width < 768;
  const isTablet = width >= 768 && width <= 1024;
  const isPC = width > 1024;

  useEffect(() => {
    if (!isClient) return;

    let animationFrame: number;

    const handleResize = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => setWidth(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient]);

  return { width, isTablet, isPhone, isPC };
}
