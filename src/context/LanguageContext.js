import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { safeStorage } from '../services/storageService';
import { translations } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = '@app_language';

const LanguageContext = createContext(null);

export const getTranslation = (keyPath, lang = 'tr', params = {}) => {
  if (!keyPath || typeof keyPath !== 'string') return '';
  const activeDict = translations[lang] || translations.tr;
  const fallbackDict = translations.tr;

  const keys = keyPath.split('.');
  let result = keys.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), activeDict);

  if (result === null || result === undefined) {
    result = keys.reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : null), fallbackDict);
  }

  if (result === null || result === undefined) {
    return keyPath;
  }

  if (typeof result === 'string' && params && typeof params === 'object') {
    let formatted = result;
    Object.keys(params).forEach((paramKey) => {
      const val = params[paramKey];
      formatted = formatted.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(val));
    });
    return formatted;
  }

  return result;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('tr');
  const [isLanguageLoaded, setIsLanguageLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    safeStorage
      .getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => {
        if (isMounted) {
          if (saved === 'tr' || saved === 'en') {
            setLanguageState(saved);
          }
          setIsLanguageLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsLanguageLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback((lang) => {
    if (lang !== 'tr' && lang !== 'en') return;
    setLanguageState(lang);
    safeStorage.setItem(LANGUAGE_STORAGE_KEY, lang).catch((err) => {
      console.warn('Dil seçimi kaydedilirken hata:', err);
    });
  }, []);

  const t = useCallback(
    (keyPath, params = {}) => {
      return getTranslation(keyPath, language, params);
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      isLanguageLoaded,
    }),
    [language, setLanguage, t, isLanguageLoaded]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage, LanguageProvider içinde kullanılmalıdır.');
  }
  return context;
};

export default LanguageContext;
