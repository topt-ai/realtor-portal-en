import { supabase } from './supabase';

export interface TopListing {
  id: string;
  titulo: string;
  views: number;
  leads: number;
}

export interface AnalyticsOverview {
  visitsThisMonth: number;
  visitsChangePct: number | null;
  newLeads: number;
  topListing: TopListing | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function fetchAnalyticsOverview(agentId: string): Promise<AnalyticsOverview> {
  const now = Date.now();
  const start30 = new Date(now - 30 * DAY_MS);
  const start60 = new Date(now - 60 * DAY_MS);

  const [eventsRes, leadsRes, listingsRes] = await Promise.all([
    supabase
      .from('listing_events')
      .select('listing_id, created_at')
      .eq('event_type', 'view')
      .gte('created_at', start60.toISOString()),
    supabase
      .from('leads')
      .select('id, listing_id, created_at')
      .eq('agent_id', agentId)
      .gte('created_at', start30.toISOString()),
    supabase
      .from('listings')
      .select('id, titulo')
      .eq('agent_id', agentId),
  ]);

  if (eventsRes.error) console.error('fetchAnalyticsOverview events error:', eventsRes.error);
  if (leadsRes.error) console.error('fetchAnalyticsOverview leads error:', leadsRes.error);
  if (listingsRes.error) console.error('fetchAnalyticsOverview listings error:', listingsRes.error);

  const events = eventsRes.data ?? [];
  const leads = leadsRes.data ?? [];
  const listingTitles = new Map((listingsRes.data ?? []).map((l) => [l.id, l.titulo as string]));

  const start30Ms = start30.getTime();
  let visitsThisMonth = 0;
  let visitsPriorMonth = 0;
  const viewsByListing = new Map<string, number>();

  for (const e of events) {
    const t = new Date(e.created_at).getTime();
    if (t >= start30Ms) {
      visitsThisMonth += 1;
      viewsByListing.set(e.listing_id, (viewsByListing.get(e.listing_id) ?? 0) + 1);
    } else {
      visitsPriorMonth += 1;
    }
  }

  const visitsChangePct =
    visitsPriorMonth === 0
      ? visitsThisMonth > 0
        ? 100
        : null
      : Math.round(((visitsThisMonth - visitsPriorMonth) / visitsPriorMonth) * 100);

  const leadsByListing = new Map<string, number>();
  for (const l of leads) {
    if (!l.listing_id) continue;
    leadsByListing.set(l.listing_id, (leadsByListing.get(l.listing_id) ?? 0) + 1);
  }

  let topListing: TopListing | null = null;
  let topViews = 0;
  for (const [listingId, views] of viewsByListing) {
    if (views > topViews) {
      topViews = views;
      topListing = {
        id: listingId,
        titulo: listingTitles.get(listingId) ?? 'Sin titulo',
        views,
        leads: leadsByListing.get(listingId) ?? 0,
      };
    }
  }

  return {
    visitsThisMonth,
    visitsChangePct,
    newLeads: leads.length,
    topListing,
  };
}
