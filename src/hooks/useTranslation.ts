import { useEffect, useState } from 'react';
import LanguageManager from '../localization';

export const useTranslation = () => {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const updateLanguage = () => forceUpdate({});
    return updateLanguage;
  }, []);

  return {
    t: (key: string, options?: any) => LanguageManager.t(key, options),
    currentLanguage: LanguageManager.getCurrentLanguage(),
    isRTL: LanguageManager.isRTL(),
    setLanguage: (language: string) => {
      LanguageManager.setLanguage(language);
      forceUpdate({});
    },
  };
};
