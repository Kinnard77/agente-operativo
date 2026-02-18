/**
 * @file blueprint.ts
 * @project Agente Operativo Odisea
 * @description Estructura de datos para el MVP de Cronograma Rígido.
 */

// Tipo estricto para horarios
export type Hora = "POR DEFINIR" | `${number}${number}:${number}${number}`;

export type EstadoOperativo = 'BLOQUEADO' | 'INCOMPLETO' | 'VALIDADO' | 'LISTO_PARA_OPERAR';
export type ModoOperativo = 'PLANEACIÓN' | 'CERTIFICACIÓN';

export interface BlockerOperativo {
    categoria: 'RUTA' | 'CRONOGRAMA' | 'LOGÍSTICA';
    mensaje: string;
    critico: boolean;
    evidencia_requerida?: string;
}

export interface ResultadoValidacion {
    estado: EstadoOperativo;
    bloqueadores: BlockerOperativo[];
    timestamp_auditoria: string;
}

export interface CheckpointOperativo {
    id: string;
    localizacion: string;
    h_llegada: Hora;
    h_salida: Hora;
    es_comida?: boolean;
}

export interface ItinerarioSalida {
    id_salida: string;
    // Internal / DB fields
    id?: string; // UUID
    transportista_id?: string;

    ciudad_origen: string;
    ciudad_salida: string; // Alias de ciudad_origen
    punto_encuentro: string;
    coordenadas_salida?: string; // "lat, lng"
    destino_final: string;
    destino: string; // Alias de destino_finalida: string;
    fecha_salida: string;
    timestamp_creacion: string;

    modo: ModoOperativo; // Controla el rigor del validador
    auditoria: ResultadoValidacion;

    precio_total?: number;
    hora_salida?: Hora; // "HH:MM" o "POR DEFINIR"

    ruta_critica: CheckpointOperativo[];
    logistica: {
        capacidad_requerida: number;
    };

    ventana_comida: {
        inicio: Hora;
        fin: Hora;
    };
}
