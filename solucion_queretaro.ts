import { IngestaDatosBase, generarBorradorItinerario } from './ingesta';
import { validarItinerario } from '@/validator';
import { generarReporteMarkdown } from './reporte';
import { establecerVentanaComida, actualizarCronograma, definirPuntoSalida, actualizarCapacidad } from './operador';

/**
 * SIMULACIÓN CONSTITUCIONAL: Querétaro (Rigor 3+1 y Prioridades)
 */

async function ejecutarSimulacion() {
    console.log("=== ARQUITECTO SILENCIOSO: AUDITORÍA BAJO CONSTITUCIÓN ===\n");

    // 1. INGESTA INICIAL (Modo Planeación)
    const ingesta: IngestaDatosBase = {
        ciudad_origen: "Querétaro",
        fecha_salida: "2026-05-20"
        // capacidad_estimada omitida para forzar Priority 3
    };

    let itinerario = generarBorradorItinerario(ingesta);
    itinerario.auditoria = validarItinerario(itinerario);

    console.log("--- FASE 1: BORRADOR INICIAL (REGLA 3+1) ---");
    console.log(generarReporteMarkdown(itinerario));

    console.log("\n--- FASE 2: RESOLVIENDO PRIORIDADES (COMIDA -> PUNTO SALIDA) ---\n");

    // Resolvemos COMIDA (Priority 1)
    itinerario = establecerVentanaComida(itinerario, "13:00", "14:30");
    itinerario.auditoria = validarItinerario(itinerario);

    console.log("--- REPORTE TRAS RESOLVER COMIDA (NUEVA ACCIÓN ÚNICA: UBICAR) ---");
    console.log(generarReporteMarkdown(itinerario));

    // Resolvemos PUNTO SALIDA (Priority 2)
    itinerario = definirPuntoSalida(itinerario, "Hotel Plaza Querétaro");
    itinerario.auditoria = validarItinerario(itinerario);

    console.log("--- REPORTE TRAS RESOLVER PUNTO SALIDA (NUEVA ACCIÓN ÚNICA: CUANTIFICAR) ---");
    console.log(generarReporteMarkdown(itinerario));

    // Resolvemos CAPACIDAD (Priority 3)
    itinerario = actualizarCapacidad(itinerario, 45);
    itinerario.auditoria = validarItinerario(itinerario);

    console.log("\n--- FASE 3: CERTIFICACIÓN FINAL ---\n");

    // Cargamos horarios para completar ruta
    itinerario = actualizarCronograma(itinerario, {
        "stop-1": { l: "07:00", s: "07:15" },
        "stop-2": { l: "09:30", s: "10:30" },
        "stop-3": { l: "13:15", s: "14:15" },
        "stop-4": { l: "16:00", s: "16:45" },
        "stop-5": { l: "18:30", s: "18:30" }
    });

    itinerario.modo = 'CERTIFICACIÓN';
    itinerario.auditoria = validarItinerario(itinerario);

    console.log("--- RESULTADO FINAL CERTIFICADO ---");
    console.log(generarReporteMarkdown(itinerario));
}

ejecutarSimulacion();
