export type PropertyType =
  | 'casa'
  | 'apartamento'
  | 'terreno'
  | 'local comercial'
  | 'oficina';

export type SoldStatus = 'disponible' | 'vendido' | 'alquilado';

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
}
