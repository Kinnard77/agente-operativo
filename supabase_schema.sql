-- 1. SUPABASE SQL (Arquitectura Híbrida)
-- Descripción: Arquitectura para Agente Pasivo/Activo con persistencia híbrida.
-- Los campos de "primer nivel" son relacionales para consultas rápidas.
-- El detalle complejo del itinerario viaja en JSONB para flexibilidad del Agente IA.

-- Habilitar extensión UUID
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- TABLA 1: itinerario_salidas
-- Propósito: Almacena la "Verdad Central" de cada operación.
-- Relación: 1:N con transportistas_visitas (aunque conceptualmente el carrier se asigna a toda la salida).
-- -----------------------------------------------------------------------------
create table public.itinerario_salidas (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  
  -- Campos Relacionales (Queryables e Indexables)
  id_salida text not null,               -- ID Humano legible (ej. "MTY-QRO-001")
  estado text not null,                  -- 'BLOQUEADO', 'INCOMPLETO', 'VALIDADO', 'LISTO_PARA_OPERAR'
  modo text not null,                    -- 'PLANEACIÓN' (Borrador) vs 'CERTIFICACIÓN' (Final)
  ciudad_origen text not null,           -- Para filtros rápidos
  destino_final text not null,           -- Para filtros rápidos
  fecha_salida date not null,            -- Tipo DATE para consultas de calendario
  
  -- Payload Híbrido (No-SQL)
  -- Contiene: ruta_critica (checkpoints), logistica (capacidad), ventana_comida, auditoria_detalle
  itinerario jsonb not null, 
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- Restricción: Un usuario no puede repetir el ID de salida
  constraint itinerario_salidas_id_salida_user_unique unique (user_id, id_salida)
);

-- RLS: Seguridad a nivel de fila
alter table public.itinerario_salidas enable row level security;

create policy "Users can CRUD their own itinerarios"
on public.itinerario_salidas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- TABLA 2: transportistas_visitas
-- Propósito: Registro de interacción con proveedores externos.
-- Relación: N:1 con itinerario_salidas (Link por salida_id)
-- -----------------------------------------------------------------------------
create table public.transportistas_visitas (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null default auth.uid() references auth.users(id),
  
  -- Foreign Key vital
  salida_id uuid not null references public.itinerario_salidas(id) on delete cascade,
  
  -- Datos del Transportista
  nombre text,                           -- Nombre de la empresa o chofer
  telefono text,                         -- Contacto operativo
  unidad_vista text,                     -- Placas o modelo (si se conoce)
  capacidad int,                         -- Capacidad confirmada
  
  -- Checklist de Validación (Booleanos para fácil reporte)
  seguro_viajero boolean default false,
  puntualidad_acordada boolean default false,
  
  -- Metadata abierta
  notas text,                            -- Observaciones libres
  created_at timestamptz default now()
);

-- RLS
alter table public.transportistas_visitas enable row level security;

create policy "Users can CRUD their own visitas"
on public.transportistas_visitas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- ÍNDICES DE RENDIMIENTO
-- -----------------------------------------------------------------------------
create index idx_itinerarios_user on public.itinerario_salidas(user_id);
create index idx_itinerarios_fecha on public.itinerario_salidas(fecha_salida);
create index idx_itinerarios_estado on public.itinerario_salidas(estado);
create index idx_visitas_salida on public.transportistas_visitas(salida_id);
