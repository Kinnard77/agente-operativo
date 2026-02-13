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
    ciudad_origen: string;
    destino_final: string;
    fecha_salida: string;
    timestamp_creacion: string;

    modo: ModoOperativo; // Controla el rigor del validador
    auditoria: ResultadoValidacion;

    ruta_critica: CheckpointOperativo[];
    logistica: {
        capacidad_requerida: number;
    };

    ventana_comida: {
        inicio: Hora;
        fin: Hora;
    };
}
