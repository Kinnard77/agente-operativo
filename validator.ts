import { ItinerarioSalida, ResultadoValidacion, BlockerOperativo, EstadoOperativo } from './blueprint';

/**
 * @function validarItinerario
 * @description Audita el cronograma siguiendo la Constitución del Arquitecto Silencioso.
 */
export function validarItinerario(itinerario: ItinerarioSalida): ResultadoValidacion {
    const bloqueadores: BlockerOperativo[] = [];
    const { modo, ventana_comida, ruta_critica, logistica, ciudad_origen } = itinerario;
    const esCertificacion = modo === 'CERTIFICACIÓN';

    // 1. PRIORIDAD 1: COMIDA
    if (ventana_comida.inicio === "POR DEFINIR") {
        bloqueadores.push({
            categoria: 'CRONOGRAMA',
            mensaje: 'Ventana de COMIDA pendiente por definir.',
            critico: esCertificacion,
            evidencia_requerida: 'Establecer ventana horaria negociada'
        });
    }

    // 2. PRIORIDAD 2: PUNTO DE SALIDA (Ubicación del primer nodo)
    const puntoSalida = ruta_critica[0];
    if (puntoSalida.localizacion === "POR DEFINIR" || puntoSalida.localizacion === ciudad_origen) {
        // Si la localización es solo la ciudad sin punto exacto, se considera pendiente
        bloqueadores.push({
            categoria: 'RUTA',
            mensaje: 'Punto de salida exacto por definir.',
            critico: esCertificacion,
            evidencia_requerida: 'Especificar dirección o lugar de salida'
        });
    }

    // 3. PRIORIDAD 3: CAPACIDAD
    if (logistica.capacidad_requerida <= 0) {
        bloqueadores.push({
            categoria: 'LOGÍSTICA',
            mensaje: 'Capacidad requerida no especificada.',
            critico: esCertificacion,
            evidencia_requerida: 'Definir número de PAX'
        });
    }

    // 4. PRIORIDAD 4: HORARIOS
    const horariosFaltantes = ruta_critica.some(cp => cp.h_llegada === "POR DEFINIR" || cp.h_salida === "POR DEFINIR");
    if (horariosFaltantes) {
        bloqueadores.push({
            categoria: 'CRONOGRAMA',
            mensaje: 'Existen horarios pendientes en la ruta.',
            critico: esCertificacion,
            evidencia_requerida: 'Completar cronograma de paradas'
        });
    }

    // 5. VALIDACIÓN DE CONSISTENCIA LÓGICA (Crítica siempre que haya datos)
    ruta_critica.forEach((current, i) => {
        if (current.h_llegada !== "POR DEFINIR" && current.h_salida !== "POR DEFINIR") {
            if (current.h_llegada > current.h_salida) {
                bloqueadores.push({
                    categoria: 'RUTA',
                    mensaje: `Error: llegada posterior a salida en ${current.localizacion}.`,
                    critico: true
                });
            }
            if (i > 0) {
                const prev = ruta_critica[i - 1];
                if (prev.h_salida !== "POR DEFINIR" && prev.h_salida > current.h_llegada) {
                    bloqueadores.push({
                        categoria: 'RUTA',
                        mensaje: `Error de secuencia entre ${prev.localizacion} y ${current.localizacion}.`,
                        critico: true
                    });
                }
            }
        }
    });

    // DETERMINACIÓN DE ESTADO
    let estado: EstadoOperativo = 'LISTO_PARA_OPERAR';
    const tieneCriticos = bloqueadores.some(b => b.critico);
    const tienePendientes = bloqueadores.some(b => !b.critico);

    if (tieneCriticos) {
        estado = 'BLOQUEADO';
    } else if (tienePendientes) {
        estado = 'INCOMPLETO';
    } else if (modo === 'PLANEACIÓN') {
        estado = 'VALIDADO';
    }

    return {
        estado,
        bloqueadores,
        timestamp_auditoria: new Date().toISOString()
    };
}
