'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n, languages } from '@/providers/I18nProvider';
import { Globe, ChevronDown, Check, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function LanguageSwitcher() {
  const { currentLanguage, changeLanguage, setShowCountryPopup, t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedLang = languages.find((l) => l.code === currentLanguage) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/10"
      >
        <Globe className="h-4 w-4 text-gold-energy" />
        <span className="hidden sm:inline-block">{selectedLang.name}</span>
        <span className="inline-block sm:hidden uppercase">{selectedLang.code}</span>
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl border border-white/10 bg-[#0a0a0a] shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div className="py-1">
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      changeLanguage(lang.code);
                      setIsOpen(false);
                    }}
                    className={`group flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                      currentLanguage === lang.code
                        ? 'bg-gold-energy/20 text-gold-energy'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <span>{lang.name}</span>
                    {currentLanguage === lang.code && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-white/10 mt-1 pt-1">
                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowCountryPopup(true);
                      setIsOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-xs font-semibold text-gold-energy transition-colors hover:bg-white/10"
                  >
                    <MapPin className="h-3 w-3" />
                    {t('nav.change_location', 'Change Location')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
