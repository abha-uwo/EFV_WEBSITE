'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, ArrowRight, KeyRound, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface UWOLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
  initialRegister?: boolean;
  appCode?: string;
  apiKey?: string;
}

export const UWOLoginModal: React.FC<UWOLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRegister = false,
  appCode = 'efv',
  apiKey = process.env.NEXT_PUBLIC_UWO_API_KEY || process.env.UWO_MASTER_API_KEY || '',
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'forgot' | 'reset'>(
    initialRegister ? 'register' : 'signin'
  );
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    setAuthMode(initialRegister ? 'register' : 'signin');
    setError('');
    setSuccessMsg('');
  }, [initialRegister, isOpen]);

  if (!isOpen) return null;

  const UNIFIED_API_URL =
    process.env.NEXT_PUBLIC_UNIFIED_API_URL ||
    'https://uwo24.com/api';

  const EFV_API_URL =
    process.env.NEXT_PUBLIC_API_URL || 'https://efv-b-246449377479.asia-south1.run.app';

  // On uwo24.com the central auth routes are under /unified-auth/, not /auth/
  const isUwoLive = UNIFIED_API_URL.includes('uwo24.com');
  const authBase = isUwoLive ? `${UNIFIED_API_URL}/unified-auth` : `${UNIFIED_API_URL}/auth`;

  const isRegisterMode = authMode === 'register';

  // Helper for final session provisioning in EFV
  const completeSessionProvisioning = async (loginData: any, userEmail: string, userName: string) => {
    let uwoUser: any = { email: userEmail, name: userName || userEmail.split('@')[0] };
    try {
      const meRes = await axios.get(`${authBase}/me`, {
        headers: { Authorization: `Bearer ${loginData.access_token}` },
      });
      if (meRes.data) {
        uwoUser = meRes.data;
      }
    } catch (meErr) {
      console.warn('Failed to fetch /auth/me:', meErr);
    }

    let efvUserData: any = {
      _id: 'uwo_' + Date.now(),
      name: uwoUser.name || userName || userEmail.split('@')[0],
      email: uwoUser.email || userEmail,
      token: loginData.access_token,
    };

    try {
      const efvRes = await axios.post(`${EFV_API_URL}/api/auth/uwo-login`, {
        email: uwoUser.email || userEmail,
        name: uwoUser.name || userName || userEmail.split('@')[0],
        uwo_token: loginData.access_token,
      });

      if (efvRes.data) {
        efvUserData = efvRes.data;
      }
    } catch (efvErr) {
      console.warn('[UWO SSO] EFV Backend session provision fallback:', efvErr);
    }

    localStorage.setItem('efv_auth_user', JSON.stringify(efvUserData));
    localStorage.setItem('efv_user', JSON.stringify(efvUserData));
    if (efvUserData.token) {
      localStorage.setItem('authToken', efvUserData.token);
    }
    localStorage.setItem('uwo_access_token', loginData.access_token);
    localStorage.setItem('uwo_user', JSON.stringify(uwoUser));

    window.dispatchEvent(new Event('efv_user_logged_in'));

    if (onSuccess) onSuccess(efvUserData);
    onClose();
  };

  // 1. Submit Registration or Login
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isRegisterMode) {
        try {
          await axios.post(
            `${authBase}/register`,
            { name, email, password },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Application-Key': apiKey,
              },
            }
          );
          setSuccessMsg('Account created successfully! Signing in...');
        } catch (regErr: any) {
          const detail = regErr.response?.data?.detail || regErr.response?.data?.message;
          let errorText = 'Registration failed';
          if (typeof detail === 'string') {
            errorText = detail;
          } else if (Array.isArray(detail)) {
            errorText = detail.map((d: any) => d.msg || d.detail || JSON.stringify(d)).join(', ');
          }

          if (errorText.toLowerCase().includes('already exists')) {
            errorText = 'An account with this email already exists. Switching to Sign In...';
            setTimeout(() => {
              setAuthMode('signin');
              setError('');
            }, 1800);
          }
          throw new Error(errorText);
        }
      }

      // Authenticate & Obtain Central UWO Tokens
      const loginRes = await axios.post(
        `${authBase}/login`,
        { email, password },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Application-Key': apiKey,
          },
        }
      );

      const loginData = loginRes.data;
      await completeSessionProvisioning(loginData, email, name);
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  // 2. Request OTP for Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await axios.post(
        `${authBase}/forgot-password`,
        { email: email.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Application-Key': apiKey,
          },
        }
      );

      setSuccessMsg(res.data?.message || 'A 6-digit code has been sent to your email.');
      if (res.data?.otp_preview) {
        setOtp(res.data.otp_preview);
      }
      setTimeout(() => {
        setAuthMode('reset');
        setError('');
      }, 1000);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Error requesting password reset';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  // 3. Submit OTP and Set New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await axios.post(
        `${authBase}/reset-password`,
        {
          email: email.trim(),
          otp: otp.trim(),
          new_password: newPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Application-Key': apiKey,
          },
        }
      );

      setSuccessMsg(res.data?.message || 'Password reset successfully! Signing in...');
      setPassword(newPassword);

      // Auto login with new password
      try {
        const loginRes = await axios.post(
          `${authBase}/login`,
          { email: email.trim(), password: newPassword },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Application-Key': apiKey,
            },
          }
        );

        if (loginRes.data) {
          await completeSessionProvisioning(loginRes.data, email.trim(), name);
          return;
        }
      } catch (autoErr) {
        console.warn('Auto login after reset fallback:', autoErr);
      }

      setAuthMode('signin');
      setSuccessMsg('Password reset successful! Please sign in with your new password.');
      setLoading(false);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || 'Failed to reset password';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-md p-7 bg-[#0b0c10] border border-[#d4af37]/30 rounded-[32px] shadow-[0_25px_60px_-15px_rgba(212,175,55,0.2)] overflow-hidden text-white"
        >
          {/* Gold atmospheric glows */}
          <div className="absolute top-[-25%] right-[-25%] w-48 h-48 bg-[#d4af37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-[-25%] left-[-25%] w-48 h-48 bg-[#b8860b]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#d4af37] to-[#f3e5ab] p-0.5 shadow-lg shadow-[#d4af37]/20 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b0c10] rounded-[14px] flex items-center justify-center text-[#d4af37]">
                  <Zap className="w-5 h-5 fill-[#d4af37]" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                  {authMode === 'register' && 'Create UWO Account'}
                  {authMode === 'signin' && 'UWO SSO Sign In'}
                  {authMode === 'forgot' && 'Reset Password'}
                  {authMode === 'reset' && 'Set New Password'}
                </h3>
                <p className="text-[11px] font-medium text-gray-400">Unified Web Options Identity Platform</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs (Sign In / Register) */}
          {(authMode === 'signin' || authMode === 'register') && (
            <div className="flex p-1 mt-5 bg-black/60 border border-white/10 rounded-2xl relative z-10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setError('');
                  setSuccessMsg('');
                }}
                className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
                  authMode === 'register'
                    ? 'bg-gradient-to-r from-[#d4af37] to-[#f3e5ab] text-black shadow-md font-bold'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Back Header for Forgot / Reset */}
          {(authMode === 'forgot' || authMode === 'reset') && (
            <div className="mt-4 flex items-center justify-between text-xs text-gray-400 relative z-10">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setError('');
                  setSuccessMsg('');
                }}
                className="flex items-center gap-1.5 text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
              <span className="text-[11px] text-gray-400">
                {authMode === 'forgot' ? 'Step 1 of 2' : 'Step 2 of 2'}
              </span>
            </div>
          )}

          {/* Feedback Messages */}
          <div className="mt-4 space-y-2 relative z-10">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </div>

          {/* FLOW 1: Sign In or Register Form */}
          {(authMode === 'signin' || authMode === 'register') && (
            <form onSubmit={handleSubmit} className="mt-4 space-y-4 relative z-10">
              {isRegisterMode && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                    Full Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sanskar Sharma"
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@uwo24.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Password
                  </label>
                  {!isRegisterMode && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] font-semibold text-[#d4af37] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] hover:opacity-95 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-black" />
                    {isRegisterMode ? 'Register & Sign In' : 'Sign In with UWO'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FLOW 2: Forgot Password (Step 1: Enter Email) */}
          {authMode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="mt-4 space-y-4 relative z-10">
              <p className="text-xs text-gray-300 leading-relaxed">
                Enter your registered central UWO email address. We will generate a secure 6-digit verification code to reset your password.
              </p>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@uwo24.com"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] hover:opacity-95 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* FLOW 3: Reset Password (Step 2: Enter OTP & New Password) */}
          {authMode === 'reset' && (
            <form onSubmit={handleResetPassword} className="mt-4 space-y-4 relative z-10">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                  6-Digit Verification Code
                </label>
                <div className="relative flex items-center">
                  <KeyRound className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-10 pr-4 py-2.5 text-sm tracking-widest bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 ml-1">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#b8860b] hover:opacity-95 text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_10px_25px_-5px_rgba(212,175,55,0.3)] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Reset Password & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer mode toggle */}
          <div className="mt-5 pt-3.5 border-t border-white/10 text-center text-xs text-gray-400 relative z-10">
            {authMode === 'register' && (
              <span>
                Already have a UWO account?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-[#d4af37] font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
            {authMode === 'signin' && (
              <span>
                New to UWO Platform?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="text-[#d4af37] font-bold hover:underline ml-1 cursor-pointer"
                >
                  Create an Account
                </button>
              </span>
            )}
            {(authMode === 'forgot' || authMode === 'reset') && (
              <span>
                Remembered your password?{' '}
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-[#d4af37] font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign In
                </button>
              </span>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UWOLoginModal;
