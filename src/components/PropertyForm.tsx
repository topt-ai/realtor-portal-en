import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, Star } from 'lucide-react';
import { Property } from '@/types';
import { addListing, updateListing, uploadImage } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { STORAGE_KEYS } from '@/config';

interface PropertyFormProps {
  initialData?: Partial<Property>;
  isEditing?: boolean;
}

const DRAFT_KEY = STORAGE_KEYS.propertyDraft;
const AUTOSAVE_INTERVAL_MS = 30_000;

const PROPERTY_TYPE_OPTIONS: { value: NonNullable<Property['property_type']>; label: string }[] = [
  { value: 'casa', label: 'House' },
  { value: 'apartamento', label: 'Apartment' },
  { value: 'terreno', label: 'Land' },
  { value: 'local comercial', label: 'Commercial Space' },
  { value: 'oficina', label: 'Office' },
];

const SOLD_STATUS_OPTIONS: { value: Property['sold_status']; label: string }[] = [
  { value: 'disponible', label: 'Available' },
  { value: 'vendido', label: 'Sold' },
  { value: 'alquilado', label: 'Rented' },
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
        `We found an unsaved draft (${new Date(saved.savedAt).toLocaleString()}). Would you like to restore it?`
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
        alert('Error saving property. Please try again.');
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('An error occurred: ' + error.message);
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
      alert('Error uploading images');
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
          {isEditing ? 'Edit Property' : 'Add Property'}
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
            Featured
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-brand-accent"
            >
              <option value="publicado">Published</option>
              <option value="borrador">Draft</option>
              <option value="archivado">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {draftRestoredAt && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg px-4 py-2">
          Draft restored from {new Date(draftRestoredAt).toLocaleString()}.
        </div>
      )}

      <div className="bg-brand-white rounded-xl shadow-sm p-6 space-y-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              name="titulo"
              required
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="e.g. Modern House in Downtown"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Operation Type</label>
            <select
              name="tipo"
              required
              value={formData.tipo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
            >
              <option value="venta">For Sale</option>
              <option value="alquiler">For Rent</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Property Type</label>
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
            <label className="block text-sm font-medium text-gray-700">Availability</label>
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
            <label className="block text-sm font-medium text-gray-700">Price ($)</label>
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
            <label className="block text-sm font-medium text-gray-700">Negotiable</label>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer select-none">
              <input
                type="checkbox"
                name="negociable"
                checked={!!formData.negociable}
                onChange={(e) => setFormData(prev => ({ ...prev, negociable: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Negotiable price</span>
            </label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Location</label>
            <input
              type="text"
              name="ubicacion"
              required
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="e.g. Downtown, New York"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="descripcion"
              required
              rows={4}
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all resize-none"
              placeholder="Describe the property..."
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
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
            <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
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
            <label className="block text-sm font-medium text-gray-700">Square Feet</label>
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
            <label className="block text-sm font-medium text-gray-700">Contact WhatsApp</label>
            <input
              type="text"
              name="whatsapp"
              required
              value={formData.whatsapp}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="e.g. 15555550100"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Video URL <span className="text-gray-400 font-normal">(optional, YouTube or MP4)</span>
            </label>
            <input
              type="url"
              name="video_url"
              value={formData.video_url || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-accent focus:border-transparent outline-none transition-all"
              placeholder="https://youtube.com/watch?v=... or https://.../video.mp4"
            />
          </div>
        </div>
      </div>

      <div className="bg-brand-white rounded-xl shadow-sm p-6 space-y-4 border border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Photos</h2>

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
              <p className="text-gray-600 font-medium">Uploading images...</p>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium">Drag your photos here</p>
              <p className="text-sm text-gray-400 mt-1">or click to select</p>
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
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="px-6 py-3 bg-brand-accent hover:bg-brand-accent-hover text-brand-white font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="animate-spin h-4 w-4" />}
          {isEditing ? 'Save Changes' : 'Publish Property'}
        </button>
      </div>
    </form>
  );
}
