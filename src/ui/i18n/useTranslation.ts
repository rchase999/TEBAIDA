import { useState, useEffect, useCallback } from 'react';
import { t, getLocale, onLocaleChange, type Locale } from './index';

export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    return onLocaleChange((newLocale) => {
      setLocaleState(newLocale);
    });
  }, []);

  const translate = useCallback((key: string, params?: Record<string, string | number>) => {
    return t(key, params);
  }, [locale]); // eslint-disable-line react-hooks/exhaustive-deps

  return { t: translate, locale };
}
