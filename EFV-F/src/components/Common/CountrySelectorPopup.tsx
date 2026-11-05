'use client';

import React from 'react';
import { useI18n, countryLanguageMap } from '@/providers/I18nProvider';
import { Globe, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Only list a curated set of prominent countries for the popup or all available
const countries = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
];

export default function CountrySelectorPopup() {
  const { showCountryPopup, handleCountrySelect, setShowCountryPopup, selectedCountry, t } = useI18n();
  const canClose = !!selectedCountry || (typeof window !== 'undefined' && !!localStorage.getItem('efv_country_selected'));
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <AnimatePresence>
      {showCountryPopup && (
        <React.Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => canClose && setShowCountryPopup(false)}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2 text-white">
                <Globe className="h-5 w-5 text-gold-energy" />
                <h2 className="font-semibold">{t('location.title', 'Choose Your Location')}</h2>
              </div>
              {canClose && (
                <button
                  onClick={() => setShowCountryPopup(false)}
                  className="rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3 text-left transition-all hover:border-gold-energy/50 hover:bg-gold-energy/10 active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <span className="text-sm font-medium text-white">{country.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-t border-white/10 bg-white/5 p-4 text-center text-xs text-white/50">
              {t('location.footer', 'Setting your region unlocks localized content and pricing.')}
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
}
