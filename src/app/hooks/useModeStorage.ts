import { useState, useEffect } from 'react';

const useModeStorage = (defaultMode = 'REGULAR') => {
  const [mode, setMode] = useState(() => {
    const storedMode = localStorage.getItem('mode');
    return storedMode !== null ? storedMode : defaultMode;
  });

  useEffect(() => {
    localStorage.setItem('mode', mode);
  }, [mode]);

  const updateMode = (newMode) => {
    setMode(newMode);
  };

  return {
    mode,
    updateMode,
  };
};

export default useModeStorage;
