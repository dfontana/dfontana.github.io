import React, { useEffect, useState } from 'react';

const useLocalStorage = (storageKey, fallbackState) => {
  const [value, setValue] = useState(() => {
    let initValue = localStorage.getItem(storageKey);
    return typeof initValue !== 'undefined'
      ? JSON.parse(initValue)
      : fallbackState;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(value));
  }, [value, storageKey]);

  return [value, setValue, () => {
    setValue(fallbackState)
  }];
};

export { useLocalStorage }
