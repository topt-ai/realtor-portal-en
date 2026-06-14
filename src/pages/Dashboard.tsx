import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Trash2, Image as ImageIcon, Star } from 'lucide-react';
import { Property, SoldStatus } from '@/types';
import { fetchListings, deleteListing, toggleListingStatus, updateSoldStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const STATUS_LABELS: Record<Property['status'], string> = {
  publicado: 'Published',
  borrador: 'Draft',
  archivado: 'Archived',
};

const STATUS_COLORS: Record<Property['status'], string> = {
  publicado: 'bg-green-100 text-green-700',
  borrador: 'bg-yellow-100 text-yellow-700',
  archivado: 'bg-gray-100 text-gray-500',
};

const SOLD_STATUS_LABELS: Record<SoldStatus, string> = {
  disponible: 'Available',
  vendido: 'Sold',
  alquilado: 'Rented',
};

const SOLD_STATUS_COLORS: Record<SoldStatus, string> = {
  disponible: 'bg-green-100 text-green-700',
  vendido: 'bg-red-100 text-red-700',
  alquilado: 'bg-blue-100 text-blue-700',
};

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email || 'Agent';

  const loadProperties = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchListings(user.id);
    setProperties(data);
    setLoading(false);
  };

  useEffect(() => {
    loadProperties();
  }, [user]);

  const handleStatusChange = async (id: string, status: Property['status']) => {
    if (!user) return;
    setProperties(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    await toggleListingStatus(id, user.id, status);
  };

  const handleSoldStatusChange = async (id: string, sold_status: SoldStatus) => {
    if (!user) return;
    setProperties(prev => prev.map(p => p.id === id ? { ...p, sold_status } : p));
    await updateSoldStatus(id, user.id, sold_status);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this property?')) return;
    const success = await deleteListing(id, user.id);
    if (success) {
      setProperties(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Error deleting property');
    }
  };

  const total = properties.length;
  const publicados = properties.filter(p => p.status === 'publicado').length;
  const borradores = properties.filter(p => p.status === 'borrador').length;
  const featured = properties.filter(p => p.featured).length;
  const vendidos = properties.filter(p => p.sold_status === 'vendido').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-sm text-gray-500">Welcome,</p>
          <h1 className="text-2xl font-bold text-brand-primary">{displayName}</h1>
        </div>
        <Link
          to="/agregar"
          className="bg-brand-accent hover:bg-brand-accent-hover text-brand-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Add Property
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total', value: total, color: 'bg-blue-50 text-blue-700' },
          { label: 'Published', value: publicados, color: 'bg-green-50 text-green-700' },
          { label: 'Drafts', value: borradores, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Featured', value: featured, color: 'bg-amber-50 text-amber-700' },
          { label: 'Sold', value: vendidos, color: 'bg-red-50 text-red-700' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl px-5 py-4 ${stat.color} flex flex-col gap-1`}>
            <span className="text-2xl font-bold">{stat.value}</span>
            <span className="text-sm font-medium">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-brand-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Photo</th>
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium">Location</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Availability</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    You have no published properties.
                  </td>
                </tr>
              ) : (
                properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {property.fotos && property.fotos.length > 0 ? (
                        <img
                          src={property.fotos[0]}
                          alt={property.titulo}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          <ImageIcon size={24} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-brand-primary">{property.titulo}</span>
                        {property.featured && (
                          <Star size={14} className="text-yellow-400 fill-yellow-400 shrink-0" />
                        )}
                      </div>
                      <span className="text-xs text-gray-400 capitalize">
                        {property.property_type ? `${property.property_type} · ` : ''}{property.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      ${Number(property.precio || 0).toLocaleString()}
                      {property.negociable && (
                        <span className="block text-xs text-gray-400">Negotiable</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">{property.ubicacion}</td>
                    <td className="p-4">
                      <select
                        value={property.status}
                        onChange={(e) =>
                          handleStatusChange(property.id, e.target.value as Property['status'])
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[property.status]}`}
                      >
                        {(Object.keys(STATUS_LABELS) as Property['status'][]).map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <select
                        value={property.sold_status}
                        onChange={(e) =>
                          handleSoldStatusChange(property.id, e.target.value as SoldStatus)
                        }
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${SOLD_STATUS_COLORS[property.sold_status]}`}
                      >
                        {(Object.keys(SOLD_STATUS_LABELS) as SoldStatus[]).map(s => (
                          <option key={s} value={s}>{SOLD_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/editar/${property.id}`}
                          className="p-2 text-gray-400 hover:text-brand-accent transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(property.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
