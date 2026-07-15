import { useState, useEffect } from 'react';
import { Mail, Phone } from 'lucide-react';
import { Lead, LeadStatus } from '@/types';
import { fetchLeads, updateLeadStatus } from '@/lib/leads';
import { formatRelativeTime } from '@/lib/format';
import { useAuth } from '@/lib/auth';

const PUBLIC_SITE_URL = 'https://realtor-website-en.vercel.app';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  archived: 'Archived',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-gray-200 text-gray-700',
  archived: 'bg-gray-100 text-gray-400',
};

type FilterTab = 'all' | LeadStatus;

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'archived', label: 'Archived' },
];

const LOOKING_FOR_BADGES: Record<string, { label: string; className: string }> = {
  buying: { label: 'Buying', className: 'bg-blue-100 text-blue-700' },
  comprando: { label: 'Buying', className: 'bg-blue-100 text-blue-700' },
  comprar: { label: 'Buying', className: 'bg-blue-100 text-blue-700' },
  selling: { label: 'Selling', className: 'bg-purple-100 text-purple-700' },
  vendiendo: { label: 'Selling', className: 'bg-purple-100 text-purple-700' },
  vender: { label: 'Selling', className: 'bg-purple-100 text-purple-700' },
  renting: { label: 'Renting', className: 'bg-green-100 text-green-700' },
  alquilando: { label: 'Renting', className: 'bg-green-100 text-green-700' },
  alquilar: { label: 'Renting', className: 'bg-green-100 text-green-700' },
  exploring: { label: 'Just browsing', className: 'bg-amber-100 text-amber-700' },
  explorando: { label: 'Just browsing', className: 'bg-amber-100 text-amber-700' },
  explorar: { label: 'Just browsing', className: 'bg-amber-100 text-amber-700' },
};

function getLookingForBadge(value: string | null): { label: string; className: string } | null {
  if (!value) return null;
  return LOOKING_FOR_BADGES[value.toLowerCase()] ?? { label: value, className: 'bg-gray-100 text-gray-600' };
}

const MESSAGE_TRUNCATE_LENGTH = 60;

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);

  const loadLeads = async () => {
    if (!user) return;
    setLoading(true);
    const data = await fetchLeads(user.id);
    setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
  }, [user]);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    if (!user) return;
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await updateLeadStatus(id, user.id, status);
  };

  const filteredLeads = activeTab === 'all' ? leads : leads.filter(l => l.status === activeTab);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Leads</h1>
        <p className="text-sm text-gray-500">Manage inquiries from your listings.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-100">
        {TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-brand-accent text-brand-primary'
                : 'border-transparent text-gray-500 hover:text-brand-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-brand-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Interested in</th>
                <th className="p-4 font-medium">Looking for</th>
                <th className="p-4 font-medium">Timeline</th>
                <th className="p-4 font-medium">Message</th>
                <th className="p-4 font-medium">Date received</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">Loading...</td>
                </tr>
              ) : filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    No leads found.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const lookingForBadge = getLookingForBadge(lead.looking_for);
                  const isExpanded = expandedMessageId === lead.id;
                  const message = lead.message ?? '';
                  const isLong = message.length > MESSAGE_TRUNCATE_LENGTH;

                  return (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors align-top">
                      <td className="p-4">
                        <span className="font-medium text-brand-primary">{lead.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`mailto:${lead.email}`}
                            className="flex items-center gap-1.5 text-sm text-brand-accent hover:underline"
                          >
                            <Mail size={12} />
                            {lead.email}
                          </a>
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-accent hover:underline"
                            >
                              <Phone size={12} />
                              {lead.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-300">No phone provided</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {lead.listing_id ? (
                          <a
                            href={`${PUBLIC_SITE_URL}/properties/${lead.listing_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-brand-accent hover:underline"
                          >
                            {lead.listing_titulo ?? 'Property'}
                          </a>
                        ) : (
                          <span className="text-sm text-gray-500">General inquiry</span>
                        )}
                      </td>
                      <td className="p-4">
                        {lookingForBadge ? (
                          <span
                            className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${lookingForBadge.className}`}
                          >
                            {lookingForBadge.label}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">Not specified</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {lead.timeline || <span className="text-gray-300">Not specified</span>}
                      </td>
                      <td className="p-4 max-w-xs">
                        {message ? (
                          <button
                            type="button"
                            onClick={() => setExpandedMessageId(isExpanded ? null : lead.id)}
                            className={`text-left text-sm text-gray-600 ${isLong ? 'cursor-pointer hover:text-brand-accent transition-colors' : ''}`}
                          >
                            {isExpanded || !isLong
                              ? message
                              : `${message.slice(0, MESSAGE_TRUNCATE_LENGTH)}...`}
                          </button>
                        ) : (
                          <span className="text-sm text-gray-300">No message</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatRelativeTime(lead.created_at)}
                      </td>
                      <td className="p-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[lead.status]}`}
                        >
                          {(Object.keys(STATUS_LABELS) as LeadStatus[]).map(s => (
                            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
