'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Country to language code mapper
export const countryLanguageMap: Record<string, string> = {
  IN: 'hi', // India -> Hindi
  US: 'en', // USA -> English
  GB: 'en', // UK -> English
  FR: 'fr', // France -> French
  DE: 'de', // Germany -> German
  ES: 'es', // Spain -> Spanish
  AE: 'ar', // UAE -> Arabic
  SA: 'ar', // Saudi Arabia -> Arabic
  CN: 'zh-CN', // China -> Chinese
  JP: 'ja', // Japan -> Japanese
  IT: 'it', // Italy -> Italian
  PT: 'pt', // Portugal -> Portuguese
  RU: 'ru', // Russia -> Russian
  KR: 'ko', // South Korea -> Korean
};

export const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'ar', name: 'Arabic' },
  { code: 'zh-CN', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ko', name: 'Korean' },
];

interface I18nContextType {
  currentLanguage: string;
  changeLanguage: (langCode: string, isManual?: boolean) => void;
  showCountryPopup: boolean;
  setShowCountryPopup: (show: boolean) => void;
  handleCountrySelect: (countryCode: string) => void;
  selectedCountry: string | null;
  t: (key: string, defaultVal?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [showCountryPopup, setShowCountryPopup] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<Record<string, any>>({});

  // Initialize values on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isManual = localStorage.getItem('efv_lang_selected_manually') === 'true';
      let initLang = 'en';
      
      if (isManual) {
        initLang = localStorage.getItem('efv_lang') || 'en';
      } else {
        const country = localStorage.getItem('efv_selected_country');
        if (country && countryLanguageMap[country]) {
          initLang = countryLanguageMap[country];
        } else {
          initLang = localStorage.getItem('efv_lang') || 'en';
        }
      }
      
      setCurrentLanguage(initLang);

      const urlParams = new URLSearchParams(window.location.search);
      const testIp = urlParams.get('test_ip') || urlParams.get('ip');
      const sessionManual = !testIp && sessionStorage.getItem('efv_manual_country_session');
      let isProfileManual = false;
      try {
        const userRaw = localStorage.getItem('efv_auth_user') || localStorage.getItem('efv_user');
        if (userRaw && !testIp) {
          const userObj = JSON.parse(userRaw);
          if (userObj.country || (userObj.address && userObj.address.country)) {
            isProfileManual = true;
          }
        }
      } catch (e) {}

      const country = localStorage.getItem('efv_selected_country');
      if (country && !testIp) {
        setSelectedCountry(country);
      }

      // Auto-detect visitor country without showing popup (unless user profile or session locked)
      if (!sessionManual && !isProfileManual) {
        const apiBase = (window as any).API_BASE || 'http://localhost:8080';
        const testQuery = testIp ? `?test_ip=${encodeURIComponent(testIp)}` : '';
        fetch(`${apiBase}/api/geolocation/detect${testQuery}`, { cache: 'no-store', signal: AbortSignal.timeout(3500) })
          .then(res => res.json())
          .then(data => {
            if (data && data.country_code) {
              const detected = data.country_code.toUpperCase();
              localStorage.setItem('efv_selected_country', detected);
              localStorage.setItem('efv_country_selected', 'true');
              setSelectedCountry(detected);
              if (!localStorage.getItem('efv_lang_selected_manually') && countryLanguageMap[detected]) {
                changeLanguage(countryLanguageMap[detected], false);
              }
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  // Fetch translations when currentLanguage changes
  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const res = await fetch(`/locales/${currentLanguage}.json`);
        if (res.ok) {
          const data = await res.json();
          setTranslations(data);
        }
      } catch (err) {
        console.error('Error fetching translations:', err);
      }

      if (currentLanguage !== 'en') {
        try {
          const res = await fetch('/locales/en.json');
          if (res.ok) {
            const data = await res.json();
            setFallbackTranslations(data);
          }
        } catch (err) {
          console.error('Error fetching fallback translations:', err);
        }
      }
    };

    fetchTranslations();
  }, [currentLanguage]);

  const changeLanguage = (langCode: string, isManual: boolean = true) => {
    setCurrentLanguage(langCode);
    localStorage.setItem('efv_lang', langCode);
    if (isManual) {
      localStorage.setItem('efv_lang_selected_manually', 'true');
    }
    
    // Sync change language event to Vanilla JS listeners if active
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('efv-lang-changed', { detail: { language: langCode } }));
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    const lang = countryLanguageMap[countryCode] || 'en';
    localStorage.setItem('efv_country_selected', 'true');
    sessionStorage.setItem('efv_manual_country_session', countryCode);
    localStorage.setItem('efv_country_selected_manually', 'true');
    localStorage.setItem('efv_selected_country', countryCode);
    setSelectedCountry(countryCode);
    setShowCountryPopup(false);
    
    // Reset manual language selection override since a new country is being selected
    localStorage.removeItem('efv_lang_selected_manually');
    
    changeLanguage(lang, false);

    // Trigger Bot Popup after country selection (if chatbot is available)
    if (typeof window !== 'undefined') {
      const win = window as any;
      if (win.efvChatbot && typeof win.efvChatbot.showIntro === 'function') {
        setTimeout(() => {
          win.efvChatbot.showIntro();
        }, 1500); // Slightly longer delay for React transitions
      }
    }
  };

  // Translation helper function
  const t = (key: string, defaultVal?: string): string => {
    const getNestedValue = (obj: any, path: string) => {
      if (!obj) return null;
      const keys = path.split('.');
      let current = obj;
      for (const k of keys) {
        if (current === null || current === undefined) return null;
        current = current[k];
      }
      return current;
    };

    let val = getNestedValue(translations, key);
    if (val === null || val === undefined) {
      val = getNestedValue(currentLanguage !== 'en' ? fallbackTranslations : translations, key);
    }
    return (val !== null && val !== undefined) ? val : (defaultVal !== undefined ? defaultVal : key);
  };

  return (
    <I18nContext.Provider
      value={{
        currentLanguage,
        changeLanguage,
        showCountryPopup,
        setShowCountryPopup,
        handleCountrySelect,
        selectedCountry,
        t,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
