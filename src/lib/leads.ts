import { supabase } from './supabase';
import { Lead, LeadStatus } from '../types';

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  looking_for: string | null;
  timeline: string | null;
  message: string | null;
  listing_id: string | null;
  agent_id: string | null;
  status: LeadStatus;
  created_at: string;
  listing: { id: string; titulo: string } | null;
};

function rowToLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    looking_for: row.looking_for,
    timeline: row.timeline,
    message: row.message,
    listing_id: row.listing_id,
    listing_titulo: row.listing?.titulo ?? null,
    agent_id: row.agent_id,
    status: row.status,
    created_at: row.created_at,
  };
}

export async function fetchLeads(agentId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*, listing:listings(id, titulo)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchLeads error:', error);
    return [];
  }
  return (data as LeadRow[]).map(rowToLead);
}

export async function updateLeadStatus(
  leadId: string,
  agentId: string,
  status: LeadStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('updateLeadStatus error:', error);
    return false;
  }
  return true;
}

export async function fetchNewLeadsCount(agentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .eq('agent_id', agentId)
    .eq('status', 'new');

  if (error) {
    console.error('fetchNewLeadsCount error:', error);
    return 0;
  }
  return count ?? 0;
}
