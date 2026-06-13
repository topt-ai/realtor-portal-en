import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, Star } from 'lucide-react';
import { Property } from '@/types';
import { addListing, updateListing, uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  isEditing?: boolean;
}

const DRAFT_KEY = 'tuwebsv-property-draft';
const AUTOSAVE_INTERVAL_MS = 30_000;

const PROPERTY_TYPE_OPTIONS: { value: NonNullable<Property['property_type']>; label: string }[] = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'local comercial', label: 'Local Comercial' },
  { value: 'oficina', label: 'Oficina' },
];

const SOLD_STATUS_OPTIONS: { value: Property['sold_status']; label: string }[] = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'vendido', label: 'Vendido' },
  { value: 'alquilado', label: 'Alquilado' },
];

const emptyDraft = (): Partial<Property> => ({
  titulo: '',
  precio: '',
  ubicacion: '',
  descripcion: '',
  habitaciones: '',
  banos: '',
  metros: '',
  whatsapp: '',
  fotos: [],
  status: 'publicado',
  featured: false,
  tipo: 'venta',
  property_type: 'casa',
  negociable: false,
  sold_status: 'disponible',
  video_url: '',
});

export default function PropertyForm({ initialData, isEditing }: PropertyFormProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState<Partial<Property>>(() => ({
    ...emptyDraft(),
    ...initialData,
  }));
  const [draftRestoredAt, setDraftRestoredAt] = useState<string | null>(null);

  // Restore draft on mount (only for new listings)
  useEffect(() => {
    if (isEditing) return;
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as { savedAt: string; data: Partial<Property> };
      if (!saved?.data) return;
      const restore = window.confirm(
        `Encontramos un borrador sin guardar (${new Date(saved.savedAt).toLocaleString()}). ¿Deseas restaurarlo?`
      );
      if (restore) {
        setFormData({ ...emptyDraft(), ...saved.data });
        setDraftRestoredAt(saved.savedAt);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (err) {
      console.warn('Draft restore failed:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft every 30s (only for new listings)
  useEffect(() => {
    if (isEditing) return;
    const id = setInterval(() => {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ savedAt: new Date().toISOString(), data: formData })
        );
      } catch (err) {
        console.warn('Draft autosave failed:', err);
      }
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [formData, isEditing]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);

      const payload = {
        titulo: formData.titulo || '',
        precio: formData.precio || '',
        ubicacion: formData.ubicacion || '',
        descripcion: formData.descripcion || '',
        habitaciones: formData.habitaciones || '',
        banos: formData.banos || '',
        metros: formData.metros || '',
        whatsapp: formData.whatsapp || '',
        tipo: formData.tipo || 'venta',
        status: formData.status || 'publicado',
        featured: formData.featured ?? false,
        property_type: formData.property_type,
        negociable: formData.negociable ?? false,
        sold_status: formData.sold_status || 'disponible',
        agent_name: formData.agent_name,
        website_url: formData.website_url,
        video_url: formData.video_url,
      } as Omit<Property, 'id' | 'agent_id' | 'fotos'>;

      const imageUrls = formData.fotos || [];

      let success = false;
      if (isEditing && initialData?.id) {
        success = await updateListing(initialData.id, user.id, payload, imageUrls);
      } else {
        const id = await addListing(user.id, payload, imageUrls);
        success = !!id;
      }

      if (success) {
        if (!isEditing) localStorage.removeItem(DRAFT_KEY);
        navigate('/dashboard');
      } else {
        alert('Error guardando la propiedad. Por favor, intenta de nuevo.');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Ocurrió un error: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImages = async (files: File[]) => {
    if (!user) return;
    setIsUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const url = await uploadImage(user.id, file);
      if (url) urls.push(url);
    }
    if (urls.length > 0) {
      setFormData(prev => ({ ...prev, fotos: [...(prev.fotos || []), ...urls] }));
    } else {
      alert('Error subiendo imágenes');
    }
    setIsUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) uploadImages(files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = (Array.from(e.target.files) as File[]).filter(f => f.type.startsWith('image/'));
      if (files.length > 0) uploadImages(files);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-brand-primary">
          {isEditing ? 'Editar Propiedad' : 'Agregar Propiedad'}
        </h1>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, featured: !prev.featured }))}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
              formData.featured
                ? 'bg-yellow-50 border-yellow-300 text-yellow-700'
                : 'bg-gray-50 border-gray-200 text-gray-500'
            }`}
          >
            <Star size={14} className={formData.featured ? 'fill-yellow-400 text-yellow-400' : ''} />
            Destacada
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Estado:</span>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="publicado">Publicado</option>
              <option value="borrador">Borrador</option>
              <option value="archivado">Archivado</option>
            </select>
          </div>
        </div>
      </div>

      {draftRestoredAt && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
          Borrador restaurado del {new Date(draftRestoredAt).toLocaleString()}.
        </div>
      )}

      <div className="bg-brand-white rounded-xl shadow-sm p-6 space-y-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              name="titulo"
              required
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="Ej. Casa Moderna en San Benito"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Operación</label>
            <select
              name="tipo"
              required
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            >
              <option value="venta">Venta</option>
              <option value="alquiler">Alquiler</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Tipo de Propiedad</label>
            <select
              name="property_type"
              value={formData.property_type || 'casa'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            >
              {PROPERTY_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Disponibilidad</label>
            <select
              name="sold_status"
              value={formData.sold_status || 'disponible'}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            >
              {SOLD_STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Precio ($)</label>
            <input
              type="number"
              name="precio"
              required
              min="0"
              value={formData.precio || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="0"
            />
          </div>
          <div className="space-y-2 flex flex-col">
            <label className="block text-sm font-medium text-gray-700">Negociable</label>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                name="negociable"
                checked={!!formData.negociable}
                onChange={(e) => setFormData(prev => ({ ...prev, negociable: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Precio negociable</span>
            </label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              type="text"
              name="ubicacion"
              required
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="Ej. San Benito, San Salvador"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <textarea
              name="descripcion"
              required
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all resize-none"
              placeholder="Describe la propiedad..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Habitaciones</label>
            <input
              type="number"
              name="habitaciones"
              min="0"
              value={formData.habitaciones || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Baños</label>
            <input
              type="number"
              name="banos"
              min="0"
              step="0.5"
              value={formData.banos || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Metros Cuadrados</label>
            <input
              type="number"
              name="metros"
              min="0"
              value={formData.metros || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">WhatsApp de Contacto</label>
            <input
              type="text"
              name="whatsapp"
              required
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="Ej. 50370000000"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              URL de Video <span className="text-gray-400 font-normal">(opcional, YouTube o MP4)</span>
            </label>
            <input
              type="url"
              name="video_url"
              value={formData.video_url || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="https://youtube.com/watch?v=... o https://.../video.mp4"
            />
          </div>
        </div>
      </div>

      <div className="bg-brand-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Fotos</h2>

        <input
          type="file"
          multiple
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <div
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-brand-accent h-12 w-12 mb-4" />
              <p className="text-gray-600 font-medium">Subiendo imágenes...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Arrastra tus fotos aquí</p>
              <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
            </>
          )}
        </div>

        {formData.fotos && formData.fotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
            {formData.fotos.map((photo, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
              >
                <img
                  src={photo}
                  alt={`Preview ${index}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      fotos: prev.fotos?.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          disabled={isSubmitting || isUploading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-brand-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
          {isEditing ? 'Guardar Cambios' : 'Publicar Propiedad'}
        </button>
      </div>
    </form>
  );
}
