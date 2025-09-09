import React, { createContext, useState, useMemo } from 'react';
import i18n, { t } from '../services/i18n';

export const LocalizationContext = createContext();

export const LocalizationProvider = ({ children }) => {
  const [locale, setLocale] = useState(i18n.locale);

  const localizationContext = useMemo(
    () => ({
      t: (scope, options) => t(scope, { locale, ...options }),
      locale,
      setLocale: (newLocale) => {
        i18n.locale = newLocale;
        localStorage.setItem('userLanguage', newLocale); // Сохраняем выбор
        setLocale(newLocale);
      },
    }),
    [locale]
  );

  return (
    <LocalizationContext.Provider value={localizationContext}>
      {children}
    </LocalizationContext.Provider>
  );
};