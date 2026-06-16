# Flujo Móvil - Agente Operativo

> Basado en la [Constitución](CONSTITUTION.md) y los [Endpoints](endpoints.md) definidos.

## 1. Mapa de Pantallas (Navegación)

```mermaid
graph TD
    A[Dashboard General] -->|Tap en Ciudad| B[Lista de Salidas (Expandida)]
    B -->|Tap en Salida| C[Detalle de Itinerario]
    A -->|Btn Nueva Salida| D[Crear Salida (Modal/Form)]
    
    C -->|Acción: Editar| E[Editor de Itinerario]
    C -->|Acción: Transportistas| F[Gestión de Transportistas]
    C -->|Acción: Certificar| G[Validación Final]
    
    F -->|Tap en Transportista| H[Detalle/Editar Transportista]
    F -->|Btn Agregar| I[Nuevo Transportista]
```

## 2. Detalle del Flujo

### A. Dashboard General (Home)
**`GET /itinerarios`**
- **Vista:** Cards de Ciudades (Guadalajara, CDMX, Querétaro).
- **Estado UI:** 
  - Muestra contadores de salidas.
  - Halo violeta de fondo (Estética "Arquitecto").
- **Acción:** `Tap` en Card → Expande lista de salidas (acordeón).
- **Acción:** `Floating Action Button (+)` → Pantalla **Crear Salida**.

### B. Lista de Salidas (Inline)
- **Vista:** Filas con ID, Fecha y **Badge de Estado**.
- **Acción:** `Tap` en fila → Navega a **Detalle de Itinerario**.

### C. Detalle de Itinerario (`/itinerarios/:id`)
**El Hub Central de decisiones.**

#### Estados de UI
| Estado | Elemento Visual | Acciones Permitidas |
| :--- | :--- | :--- |
| **PLANEACIÓN** | Borde Indigo, Badges "POR DEFINIR" (Neutro) | Todo Editable. No bloquea. |
| **CERTIFICACIÓN** | Borde Dorado. Alertas Rojas si falta data. | Edición restringida. Bloqueo Crítico. |

#### Secciones
1.  **Header:** ID Salida + Modo (Switch Planeación/Certificación).
2.  **Ruta Crítica:** Lista de checkpoints (Origen → Destino).
3.  **Logística:** Capacidad, Ventana de Comida.
    - *Si falta data:* Muestra "POR DEFINIR" (En Planeación) o 🛑 ALERTA (En Certificación).
4.  **Transportistas:** Resumen (ej. "2 Asignados"). Botón `Gestionar`.

### D. Editor de Itinerario (`PATCH /itinerarios/:id`)
- **Inputs:** Fecha, Ciudad Origen, Destino.
- **JSON Editor:** (Para MVP) Interfaz simplificada para editar `ruta_critica` y `logistica`.
- **Regla de Oro:** NO inventar. Si el usuario deja vacío → Se guarda "POR DEFINIR".

### E. Gestión de Transportistas (`/itinerarios/:id/transportistas`)
- **Vista:** Lista de proveedores asignados a esta salida.
- **Acción:** `Tap` → Editar datos de contacto/unidad.
- **Checklist:**
  - [ ] Seguro de Viajero (Toggle bool).
  - [ ] Puntualidad Acordada (Toggle bool).
- **Nota:** Estos checks son necesarios para pasar a estado `LISTO_PARA_OPERAR`.

## 3. Transiciones de Estado (Lógica de Negocio)

1.  **Nuevo** (`POST`) → Nace en **PLANEACIÓN** / Estado **INCOMPLETO**.
2.  **Usuario completa data crítica** → Sigue en **INCOMPLETO** hasta que el usuario decida.
3.  **Usuario activa Switch "CERTIFICACIÓN"**:
    - **Agente Lanza Validación:**
      - ¿Hay "POR DEFINIR"? → **BLOQUEADO** (Muestra errores).
      - ¿Data íntegra? → **VALIDADO**.
4.  **Usuario confirma Transportistas** (Seguro + Puntualidad):
    - Si está VALIDADO + Checks OK → **LISTO_PARA_OPERAR**.

---
*Este flujo asegura que el Agente nunca asume datos y que el usuario tiene control total sobre el rigor de la validación.*
