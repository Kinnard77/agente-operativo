import { ItinerarioSalida, CheckpointOperativo } from './blueprint';

export interface IngestaDatosBase {
    ciudad_origen: string;
    fecha_salida: string;
    capacidad_estimada?: number;
}

/**
 * @function generarBorradorItinerario
 * Crea un itinerario en modo PLANEACIÓN con todos los datos clave "POR DEFINIR".
 * Sigue la Constitución del Arquitecto Silencioso.
 */
export function generarBorradorItinerario(datos: IngestaDatosBase): ItinerarioSalida {
    const timestamp = new Date().toISOString();
    const id_salida = `SAL-${datos.ciudad_origen.substring(0, 3).toUpperCase()}-${datos.fecha_salida.replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

    const ruta_critica: CheckpointOperativo[] = [
        {
            id: "stop-1",
            localizacion: "POR DEFINIR", // Priority 2: Requiere un punto exacto
            h_llegada: "POR DEFINIR",
            h_salida: "POR DEFINIR"
        },
        {
            id: "stop-2",
            localizacion: "Checkpoint 1",
            h_llegada: "POR DEFINIR",
            h_salida: "POR DEFINIR"
        },
        {
            id: "stop-3",
            localizacion: "COMIDA (Parada Rígida)",
            h_llegada: "POR DEFINIR",
            h_salida: "POR DEFINIR",
            es_comida: true
        },
        {
            id: "stop-4",
            localizacion: "Checkpoint 2",
            h_llegada: "POR DEFINIR",
            h_salida: "POR DEFINIR"
        },
        {
            id: "stop-5",
            localizacion: "Tour Odisea Challenge (Meta)",
            h_llegada: "POR DEFINIR",
            h_salida: "POR DEFINIR"
        }
    ];

    return {
        id_salida,
        ciudad_origen: datos.ciudad_origen,
        destino_final: "Tour Odisea Challenge (4 paradas)",
        fecha_salida: datos.fecha_salida,
        timestamp_creacion: timestamp,
        modo: 'PLANEACIÓN',
        auditoria: {
            estado: 'INCOMPLETO',
            bloqueadores: [],
            timestamp_auditoria: timestamp
        },
        ruta_critica,
        logistica: {
            capacidad_requerida: datos.capacidad_estimada || 0 // Default 0 para forzar Priority 3
        },
        ventana_comida: {
            inicio: "POR DEFINIR",
            fin: "POR DEFINIR"
        }
    };
}
