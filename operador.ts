import { ItinerarioSalida, Hora } from './blueprint';

/**
 * @function establecerVentanaComida
 */
export function establecerVentanaComida(itinerario: ItinerarioSalida, inicio: Hora, fin: Hora): ItinerarioSalida {
    itinerario.ventana_comida = { inicio, fin };
    return itinerario;
}

/**
 * @function actualizarCronograma
 */
export function actualizarCronograma(itinerario: ItinerarioSalida, tiempos: { [id: string]: { l: Hora, s: Hora } }): ItinerarioSalida {
    itinerario.ruta_critica.forEach(cp => {
        if (tiempos[cp.id]) {
            cp.h_llegada = tiempos[cp.id].l;
            cp.h_salida = tiempos[cp.id].s;
        }
    });
    return itinerario;
}

/**
 * @function definirPuntoSalida
 */
export function definirPuntoSalida(itinerario: ItinerarioSalida, localizacion: string): ItinerarioSalida {
    if (itinerario.ruta_critica.length > 0) {
        itinerario.ruta_critica[0].localizacion = localizacion;
    }
    return itinerario;
}

/**
 * @function actualizarCapacidad
 */
export function actualizarCapacidad(itinerario: ItinerarioSalida, capacidad: number): ItinerarioSalida {
    itinerario.logistica.capacidad_requerida = capacidad;
    return itinerario;
}
