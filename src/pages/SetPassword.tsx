import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Phase = 'checking' | 'ready' | 'invalid';

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

      // detectSessionInUrl in the supabase client will have already
      // parsed the hash and set the session. We still inspect it here to
      // (a) confirm we're in an invite/recovery flow and (b) fall back to
      // an explicit setSession call if needed.
      if (accessToken && (type === 'invite' || type === 'recovery' || type === 'signup')) {
        if (refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            if (!cancelled) setPhase('invalid');
            return;
          }
        }
        if (!cancelled) {
          setPhase('ready');
          // Clean the token out of the URL.
          window.history.replaceState(null, '', window.location.pathname);
        }
        return;
      }

      // No token in URL — check if we already have a session from a
      // previous redirect, otherwise bounce to /login.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        setPhase('ready');
      } else {
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
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate('/dashboard', { replace: true });
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
          <h1 className="text-xl font-bold text-brand-primary">Enlace inválido</h1>
          <p className="text-sm text-gray-600">
            El enlace de invitación expiró o ya fue usado. Por favor solicita uno nuevo.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full px-4 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-xl transition-colors cursor-pointer"
          >
            Ir al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-brand-primary tracking-tight">TuWebSV</h1>
          <p className="text-gray-500 text-sm">Crea tu contraseña</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
                placeholder="Mínimo 8 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="Repite la contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-accent hover:bg-brand-accent-hover text-white font-medium rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
          >
            {submitting && <Loader2 className="animate-spin h-5 w-5" />}
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
