import { supabase } from './supabase';
import { Property, PropertyType, SoldStatus } from '../types';

type ListingRow = {
  id: string;
  titulo: string;
  precio: string;
  ubicacion: string;
  descripcion: string;
  habitaciones: string;
  banos: string;
  metros: string;
  whatsapp: string;
  tipo: string;
  status: string;
  featured: boolean;
  property_type: string | null;
  negociable: boolean | null;
  sold_status: string | null;
  agent_name: string | null;
  website_url: string | null;
  video_url: string | null;
  agent_id: string;
  listing_images: { url: string; order_index: number }[];
};

function rowToProperty(row: ListingRow): Property {
  const images = (row.listing_images ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((img) => img.url);
  return {
    id: row.id,
    titulo: row.titulo,
    precio: row.precio,
    ubicacion: row.ubicacion,
    descripcion: row.descripcion,
    habitaciones: row.habitaciones,
    banos: row.banos,
    metros: row.metros,
    whatsapp: row.whatsapp,
    tipo: (row.tipo === 'alquiler' ? 'alquiler' : 'venta') as Property['tipo'],
    status: (row.status as Property['status']) ?? 'publicado',
    featured: row.featured ?? false,
    property_type: (row.property_type as PropertyType) ?? undefined,
    negociable: row.negociable ?? false,
    sold_status: (row.sold_status as SoldStatus) ?? 'disponible',
    agent_name: row.agent_name ?? undefined,
    website_url: row.website_url ?? undefined,
    video_url: row.video_url ?? undefined,
    fotos: images,
    agent_id: row.agent_id,
  };
}

type ListingPayload = Omit<Property, 'id' | 'agent_id' | 'fotos'>;

const toIntOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const toNumOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function payloadToRow(data: ListingPayload) {
  return {
    titulo: data.titulo,
    precio: toNumOrNull(data.precio),
    ubicacion: data.ubicacion,
    descripcion: data.descripcion,
    habitaciones: toIntOrNull(data.habitaciones),
    banos: toIntOrNull(data.banos),
    metros: data.metros,
    whatsapp: data.whatsapp,
    tipo: data.tipo,
    status: data.status,
    featured: data.featured,
    property_type: data.property_type ?? null,
    negociable: data.negociable ?? false,
    sold_status: data.sold_status ?? 'disponible',
    agent_name: data.agent_name ?? null,
    website_url: data.website_url ?? null,
    video_url: data.video_url ?? null,
  };
}

export async function fetchListings(agentId: string): Promise<Property[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('*, listing_images(url, order_index)')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchListings error:', error);
    return [];
  }
  return (data as ListingRow[]).map(rowToProperty);
}

export async function addListing(
  agentId: string,
  data: ListingPayload,
  imageUrls: string[]
): Promise<string | null> {
  try {
    const { data: row, error } = await supabase
      .from('listings')
      .insert({ ...payloadToRow(data), agent_id: agentId })
      .select('id')
      .single();

    if (error || !row) {
      throw error ?? new Error('Insert returned no row');
    }

    if (imageUrls.length > 0) {
      const { error: imgError } = await supabase.from('listing_images').insert(
        imageUrls.map((url, i) => ({ listing_id: row.id, url, order_index: i }))
      );
      if (imgError) throw imgError;
    }

    return row.id;
  } catch (error: any) {
    console.error('Full error:', JSON.stringify(error))
    throw new Error(JSON.stringify(error))
  }
}

export async function updateListing(
  listingId: string,
  agentId: string,
  data: ListingPayload,
  imageUrls: string[]
): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update(payloadToRow(data))
    .eq('id', listingId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('updateListing error:', error);
    return false;
  }

  await supabase.from('listing_images').delete().eq('listing_id', listingId);
  if (imageUrls.length > 0) {
    await supabase.from('listing_images').insert(
      imageUrls.map((url, i) => ({ listing_id: listingId, url, order_index: i }))
    );
  }

  return true;
}

export async function deleteListing(listingId: string, agentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .delete()
    .eq('id', listingId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('deleteListing error:', error);
    return false;
  }
  return true;
}

export async function toggleListingStatus(
  listingId: string,
  agentId: string,
  status: Property['status']
): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listingId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('toggleListingStatus error:', error);
    return false;
  }
  return true;
}

export async function updateSoldStatus(
  listingId: string,
  agentId: string,
  sold_status: SoldStatus
): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ sold_status })
    .eq('id', listingId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('updateSoldStatus error:', error);
    return false;
  }
  return true;
}

export async function uploadImage(userId: string, file: File): Promise<string | null> {
  const path = `${userId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from('property-images').upload(path, file);
  if (error) {
    console.error('uploadImage error:', error);
    return null;
  }
  const { data } = supabase.storage.from('property-images').getPublicUrl(path);
  return data.publicUrl;
}
