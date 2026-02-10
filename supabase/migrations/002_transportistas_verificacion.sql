-- MIGRATION: 002_transportistas_verificacion.sql
-- Propósito: Sistema de verificación de transportistas y control de viáticos.

-- 1. TABLA: transportistas
-- Catálogo de empresas candidatas y certificadas.
create table public.transportistas (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  nombre text not null,
  contacto text,
  telefono text,
  email text,
  tipo_unidades text, -- Ej: "Autobús 45 PAX", "Sprinter 19 PAX"
  capacidad_maxima int default 0,
  tiene_seguro_viajero boolean default false,
  estado text not null default 'CANDIDATO', -- 'CANDIDATO', 'VERIFICANDO', 'CERTIFICADO', 'RECHAZADO'
  fecha_certificacion date,
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: transportistas
alter table public.transportistas enable row level security;

create policy "Users can CRUD their own transportistas"
on public.transportistas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2. TABLA: viajes_verificacion
-- Registro de salidas de campo para inspección.
create table public.viajes_verificacion (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  fecha_viaje date not null default now(),
  region text, -- Ej: "Bajío", "Zona Metropolitana"
  
  -- Desglose de Viáticos
  gasto_gasolina decimal default 0,
  gasto_comida decimal default 0,
  gasto_hospedaje decimal default 0,
  gasto_otros decimal default 0,
  -- total_viaticos se puede calcular en cliente o con computed column, aqui simple.
  
  notas_generales text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS: viajes_verificacion
alter table public.viajes_verificacion enable row level security;

create policy "Users can CRUD their own viajes"
on public.viajes_verificacion for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 3. TABLA: viaje_transportistas (PIVOT)
-- Relación N:M entre viajes y transportistas (una visita a un proveedor).
create table public.viaje_transportistas (
  id uuid not null default gen_random_uuid() primary key,
  viaje_id uuid not null references public.viajes_verificacion(id) on delete cascade,
  transportista_id uuid not null references public.transportistas(id) on delete cascade,
  
  resultado text default 'PENDIENTE', -- 'APROBADO', 'PENDIENTE', 'RECHAZADO'
  notas_visita text,
  fotos_tickets text[], -- Array de URLs de las fotos/tickets
  
  created_at timestamptz default now()
);

-- RLS: viaje_transportistas
alter table public.viaje_transportistas enable row level security;

-- Política delegada: Si puedes ver el viaje, puedes ver sus detalles
create policy "Users can CRUD pivot based on viaje ownership"
on public.viaje_transportistas for all
using (
  exists (
    select 1 from public.viajes_verificacion v
    where v.id = viaje_transportistas.viaje_id
    and v.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.viajes_verificacion v
    where v.id = viaje_id
    and v.user_id = auth.uid()
  )
);

-- 4. MODIFICACIÓN: itinerario_salidas
-- Agregar referencia al transportista asignado (nullable, ya que al inicio no hay)
alter table public.itinerario_salidas 
add column if not exists transportista_id uuid references public.transportistas(id);

create index idx_transportistas_user on public.transportistas(user_id);
create index idx_viajes_user on public.viajes_verificacion(user_id);
create index idx_viaje_transportistas_viaje on public.viaje_transportistas(viaje_id);
