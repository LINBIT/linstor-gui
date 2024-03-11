import { VSAN_SIMPLE_MODE } from '@app/const/mode';
import { useState, useEffect } from 'react';

// VSAN Mode could be "SIMPLE" or "ADVANCED"
const useModeStorage = (defaultMode = VSAN_SIMPLE_MODE) => {
  const [mode, setMode] = useState(() => {
    const storedMode = localStorage.getItem('__vsan__mode');
    return storedMode !== null ? storedMode : defaultMode;
  });

  useEffect(() => {
    localStorage.setItem('__vsan__mode', mode);
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
