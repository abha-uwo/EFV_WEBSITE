'use client';

import { useState, useEffect } from 'react';
import nextDynamic from 'next/dynamic';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useSecurity } from '@/hooks/useSecurity';
import { Library, ShoppingBag, Zap, LogOut, User as UserIcon } from 'lucide-react';
import LanguageSwitcher from '@/components/Common/LanguageSwitcher';
import UWOLoginModal from '@/components/Common/UWOLoginModal';

// Dynamically import client components with SSR disabled to prevent 'DOMMatrix is not defined' errors
const LibraryDashboard = nextDynamic(() => import('@/components/Library/LibraryDashboard'), { ssr: false });

function AppContent() {
  useSecurity(); // Activate global security blockers
  const { user, logout } = useAuth();
  const [showUwoModal, setShowUwoModal] = useState(false);

  return (
    <main className="min-h-screen bg-black text-white selection:bg-gold-energy/30">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 border-b border-white/10 gap-4 pb-3">
          <div className="flex gap-4">
            <a
              href="/marketplace.html"
              className="flex items-center gap-2 px-6 py-3 font-bold transition-all text-white/50 hover:text-white/80"
            >
              <ShoppingBag className="w-5 h-5" />
              Marketplace
            </a>
            <div
              className="flex items-center gap-2 px-6 py-3 font-bold transition-all text-gold-energy border-b-2 border-gold-energy"
            >
              <Library className="w-5 h-5" />
              My Library
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-gold-energy">
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[140px] truncate font-medium text-white/90">{user.email || user.name}</span>
                <button
                  onClick={logout}
                  title="Log out"
                  className="p-1 hover:text-rose-400 text-white/40 transition-colors ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowUwoModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black font-bold text-xs rounded-full uppercase tracking-wider shadow-sm hover:opacity-95 transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>UWO SSO</span>
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>

        {/* Content - Just the Library Dashboard */}
        <LibraryDashboard />

        <UWOLoginModal
          isOpen={showUwoModal}
          onClose={() => setShowUwoModal(false)}
          appCode="efv"
        />
      </div>
    </main>
  );
}



export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
