import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { translateAuthError } from '@/lib/authErrors';
import { BRAND_CONFIG } from '@/config';

type Phase = 'checking' | 'ready' | 'invalid' | 'success';

const VALID_TYPES = new Set(['invite', 'recovery', 'signup', 'email_change']);

export default function SetPassword() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.slice(1)
        : window.location.hash;
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const type = params.get('type');
      const hashError = params.get('error_description') || params.get('error');

      if (hashError) {
        if (!cancelled) {
          setError(translateAuthError(hashError));
          setPhase('invalid');
        }
        return;
      }

      if (accessToken && type && VALID_TYPES.has(type)) {
        if (refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelled) {
              setError(translateAuthError(error.message));
              setPhase('invalid');
            }
            return;
          }
        }
        if (!cancelled) {
          setPhase('ready');
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // No token in URL — either already authenticated (came from a
      // password reset link that's already been consumed, or arrived
      // here while logged in) or nothing to do.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        // Already logged in with no token → straight to dashboard.
        navigate('/dashboard', { replace: true });
      } else {
        // No token and no session → bounce to login.
        navigate('/login', { replace: true });
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(translateAuthError(error.message) || 'Error saving');
      return;
    }
    setPhase('success');
    setTimeout(() => navigate('/dashboard', { replace: true }), 2000);
  };

  if (phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <Loader2 className="animate-spin text-brand-accent h-10 w-10" />
      </div>
    );
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4 text-center">
          <h1 className="text-xl font-bold text-brand-primary">Invalid link</h1>
          <p className="text-sm text-gray-600">
            {error || 'The link expired or has already been used. Please request a new one.'}
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-4 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-xl font-bold text-brand-primary">Password saved</h1>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-brand-primary tracking-tight">{BRAND_CONFIG.name}</h1>
          <p className="text-gray-500 text-sm">Create your password</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">New password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Confirm password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="Repeat the password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="animate-spin h-5 w-5" />}
            Save password
          </button>
        </form>
      </div>
    </div>
  );
}
