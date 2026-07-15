export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'terreno'
  | 'local comercial'
  | 'oficina';

export type SoldStatus = 'disponible' | 'vendido' | 'alquilado';

export interface ScoreIssue {
  issue: string;
  points: number;
}

export interface Property {
  id: string;
  titulo: string;
  precio: string;
  ubicacion: string;
  descripcion: string;
  habitaciones: string;
  banos: string;
  metros: string;
  fotos: string[];
  whatsapp: string;
  status: 'publicado' | 'borrador' | 'archivado';
  featured: boolean;
  tipo: 'venta' | 'alquiler';
  property_type?: PropertyType;
  negociable?: boolean;
  sold_status: SoldStatus;
  agent_name?: string;
  website_url?: string;
  video_url?: string;
  agent_id?: string;
  listing_score: number;
  score_issues: ScoreIssue[];
}

export type ListingEventType = 'view' | 'contact_click' | 'favorite' | 'share' | 'schedule_click';

export type LeadStatus = 'new' | 'contacted' | 'archived';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  looking_for: string | null;
  timeline: string | null;
  message: string | null;
  listing_id: string | null;
  listing_titulo: string | null;
  agent_id: string | null;
  status: LeadStatus;
  created_at: string;
}
