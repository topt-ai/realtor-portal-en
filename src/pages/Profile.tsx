import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { translateAuthError } from '@/lib/authErrors';

export default function Profile() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFullName((user.user_metadata?.full_name as string) || '');
    setPhone((user.user_metadata?.phone as string) || '');
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    });
    setSaving(false);
    if (error) {
      setError(translateAuthError(error.message));
      return;
    }
    setInfo('Perfil actualizado');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Mi Perfil</h1>
        <p className="text-sm text-gray-500">Actualiza tu información de contacto.</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">
          {error}
        </p>
      )}
      {info && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-4 py-2">
          {info}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-brand-white rounded-xl shadow-sm p-6 space-y-6 border border-gray-100"
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
          <input
            type="email"
            value={user?.email || ''}
            readOnly
            disabled
            className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Nombre completo</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            placeholder="Ej. +503 7000 0000"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-brand-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
          >
            {saving && <Loader2 className="animate-spin h-4 w-4" />}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  );
}
