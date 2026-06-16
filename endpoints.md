# Rutas y Endpoints - Agente Operativo

Documentación de la API REST para la comunicación entre la PWA y Supabase (via supabase-js).

## 1. Itinerarios
`public.itinerario_salidas`

### Listar Itinerarios (Dashboard)
- **Método:** `GET`
- **Path:** `/itinerarios`
- **Retorno:**
```json
[
  {
    "id": "uuid",
    "id_salida": "MTY-QRO-001",
    "ciudad_origen": "Monterrey",
    "destino_final": "Querétaro",
    "fecha_salida": "2026-05-20",
    "estado": "INCOMPLETO", // BLOQUEADO, VALIDADO, LISTO_PARA_OPERAR
    "modo": "PLANEACIÓN",    // PLANEACIÓN, CERTIFICACIÓN
    "updated_at": "timestamp"
  }
]
```

### Detalle de Itinerario
- **Método:** `GET`
- **Path:** `/itinerarios/:id`
- **Retorno:** Objeto completo incluyendo `itinerario` (JSONB).
```json
{
  "id": "uuid",
  "id_salida": "MTY-QRO-001",
  "itinerario": {
    "ruta_critica": [...],
    "logistica": {...},
    "ventana_comida": {...} // "POR DEFINIR" si no existe
  },
  ...otros_campos
}
```

### Crear Itinerario
- **Método:** `POST`
- **Path:** `/itinerarios`
- **Body:**
```json
{
  "id_salida": "MTY-QRO-002",
  "ciudad_origen": "CDMX",
  "destino_final": "Guadalajara",
  "fecha_salida": "2026-06-15",
  "modo": "PLANEACIÓN" // Default
}
```
*Nota: El campo `itinerario` se inicializa con estructura vacía válida por defecto.*

### Actualizar Itinerario
- **Método:** `PATCH`
- **Path:** `/itinerarios/:id`
- **Body:** Partial (cualquier campo excepto ID).
- **Restricción:** En modo CERTIFICACIÓN, cualquier update que deje campos en "POR DEFINIR" debe ser validado o rechazado por el cliente antes de enviar, pero la base de datos permite el guardado (la validación es lógica de negocio/Agente).

### Eliminar Itinerario
- **Método:** `DELETE`
- **Path:** `/itinerarios/:id`

## 2. Transportistas
`public.transportistas_visitas`

### Listar Transportistas de una Salida
- **Método:** `GET`
- **Path:** `/itinerarios/:id/transportistas`
- **Retorno:**
```json
[
  {
    "id": "uuid",
    "nombre": "Transportes del Norte",
    "telefono": "555-123-4567",
    "capacidad": 45,
    "seguro_viajero": true
  }
]
```

### Agregar Transportista
- **Método:** `POST`
- **Path:** `/itinerarios/:id/transportistas`
- **Body:**
```json
{
  "salida_id": "uuid",
  "nombre": "Transportes del Norte"
  // Resto opcional
}
```

### Actualizar Transportista
- **Método:** `PATCH`
- **Path:** `/itinerarios/:id/transportistas/:tid`
- **Body:** Partial.

### Eliminar Transportista
- **Método:** `DELETE`
- **Path:** `/itinerarios/:id/transportistas/:tid`
