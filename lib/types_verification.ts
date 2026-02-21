export type EstadoTransportista = 'CANDIDATO' | 'VERIFICANDO' | 'CERTIFICADO' | 'RECHAZADO';
export type ResultadoVisita = 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';

export interface Transportista {
    id: string;
    nombre: string;
    contacto: string;
    telefono: string;
    email: string;
    tipo_unidades: string;
    capacidad_maxima: number;
    tiene_seguro_viajero: boolean;
    contrato_firmado?: boolean;
    estado: EstadoTransportista;
    fecha_certificacion?: string;
    notas: string;
}

export interface ViajeVerificacion {
    id: string;
    fecha_viaje: string;
    region: string;
    gasto_gasolina: number;
    gasto_comida: number;
    gasto_hospedaje: number;
    gasto_otros: number;
    notas_generales: string;
    // Computed helpers
    total_viaticos?: number;
}

export interface ViajeTransportistaPivot {
    id: string;
    viaje_id: string;
    transportista_id: string;
    resultado: ResultadoVisita;
    notas_visita: string;
    fotos_tickets: string[];
    // Relation
    transportista?: Transportista;
}
