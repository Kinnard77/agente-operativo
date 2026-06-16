# Plan de Implementación PWA - Agente Operativo

Este plan convierte las definiciones arquitectónicas (SQL, Endpoints, Flujo) en pasos de código concreto.

> **Status Actual:** FASE 0 Completada (Dashboard UI Mock & SQL Defined).

## FASE 1: Detalle de Itinerario (Read-Only)
**Objetivo:** Conectar el Dashboard (ya existente) con una vista de detalle funcional que muestre la data real (aunque sea mockeada inicialmente en DB) del itinerario.

- **Dependencias:** Dashboard (Page.tsx) -> `[LINK]` -> Detalle.
- **Pantalla:** `pwa/app/itinerarios/[id]/page.tsx`
- **Endpoints:** `GET /itinerarios/:id`
- **Componentes:**
  - `HeaderItinerario` (Muestra ID, Fechas y Switch de Modo inactivo).
  - `TimelineRuta` (Visualización vertical de la `ruta_critica`).
  - `LogisticaSummary` (Card con datos de capacidad y comida).
- **Complejidad:** **MEDIA** (Requiere parsear el JSONB de `ruta_critica` para renderizarlo lindo).
- **Done:** Al hacer click en una ciudad del dashboard, navega y veo el detalle estático de esa salida.

## FASE 2: Motor de Creación y Edición
**Objetivo:** Permitir al usuario crear nuevas salidas y modificar la data "POR DEFINIR".

- **Dependencias:** Fase 1 (necesitamos la vista para ponerle los botones de editar).
- **Pantallas:**
  - Modal o Pantalla `NewSalida`.
  - Modo Edición en `/itinerarios/[id]`.
- **Endpoints:** 
  - `POST /itinerarios`
  - `PATCH /itinerarios/:id`
- **Componentes:**
  - `JsonEditorSimple` (Inputs controlados para modificar el JSONB sin romperlo).
  - `SwitchModo` (Interactivo: Planeación <-> Certificación).
- **Lógica Crítica:** Implementar la regla de "POR DEFINIR" al guardar vacíos.
- **Complejidad:** **ALTA** (Manejo de formularios complejos y validación de JSONB).
- **Done:** Puedo crear una salida "MTY-MEX-005", aparece en el dashboard, entro, edito la hora de comida y se guarda.

## FASE 3: Gestión de Transportistas
**Objetivo:** Resolver la relación 1:N con la tabla `transportistas_visitas`.

- **Dependencias:** Fase 1 (La UI de transportistas vive dentro del detalle).
- **Pantallas:** 
  - Sub-vista o Modal `GestionarTransportistas`.
- **Endpoints:**
  - `GET`, `POST`, `PATCH`, `DELETE` sobre `/itinerarios/:id/transportistas`.
- **Componentes:**
  - `TransporterCard` (Con toggles de Seguro/Puntualidad).
  - `TransporterForm`.
- **Complejidad:** **BAJA** (CRUD relacional estándar, sin JSONB complejo).
- **Done:** Puedo agregar a "Transportes Juan", marcar que tiene seguro, y verlo reflejado en el resumen.

## FASE 4: Motor de Certificación (El Juez)
**Objetivo:** Implementar la lógica de bloqueo y validación según `CONSTITUTION.md`.

- **Dependencias:** Fase 2 (Edición) y Fase 3 (Transportistas).
- **Lógica:**
  - Al activar Switch "CERTIFICACIÓN":
    - Scan de `itinerario`: ¿Hay "POR DEFINIR"?
    - Scan de `transportistas`: ¿Checklists OK?
  - Si falla -> `estado = BLOQUEADO`, mostrar lista de errores (Rigor 3+1).
  - Si pasa -> `estado = VALIDADO` -> `LISTO_PARA_OPERAR`.
- **Complejidad:** **ALTA** (Lógica de negocio pura en frontend/Agente).
- **Done:** Si intento certificar un itinerario incompleto, me grita en rojo. Si completo todo, se pone verde.

## Resumen de Estimación
1. **Fase 1 (Read-Only):** 2-3 días dev.
2. **Fase 2 (Write/Edit):** 4-5 días dev (Core del sistema).
3. **Fase 3 (Carriers):** 1-2 días dev.
4. **Fase 4 (Validation):** 2-3 días dev.
