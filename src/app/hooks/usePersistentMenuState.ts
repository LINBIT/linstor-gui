import { useState, useEffect } from 'react';

const usePersistentMenuState = (initialValue?: boolean) => {
  const [isNavOpen, setIsNavOpen] = useState(() => {
    const storedValue = sessionStorage.getItem('menuOpen');
    return storedValue !== null ? storedValue === 'true' : initialValue;
  });

  useEffect(() => {
    sessionStorage.setItem('menuOpen', String(isNavOpen));
  }, [isNavOpen]);

  return [isNavOpen, setIsNavOpen];
};

export default usePersistentMenuState;
