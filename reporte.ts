import { ItinerarioSalida } from './blueprint';

/**
 * @file reporte.ts
 * @description Generador de reportes corporativos alineado con la Constitución (Regla 3+1).
 */

export function generarReporteMarkdown(itinerario: ItinerarioSalida): string {
    const { auditoria, id_salida, ciudad_origen, fecha_salida, ruta_critica, ventana_comida, modo } = itinerario;

    const statusLabels = {
        'BLOQUEADO': '❌ BLOQUEO DE CRONOGRAMA',
        'INCOMPLETO': '⏳ PLANEACIÓN EN CURSO',
        'VALIDADO': '✅ PLANEACIÓN FINALIZADA',
        'LISTO_PARA_OPERAR': '🛡️ CERTIFICADO PARA OPERAR'
    };

    let md = `## REPORTE OPERATIVO: TOUR ODISEA CHALLENGE\n`;
    md += `**ID SALIDA:** ${id_salida} | **MODO:** ${modo}\n`;
    md += `**ESTADO:** ${statusLabels[auditoria.estado]}\n`;
    md += `**ORIGEN:** ${ciudad_origen} | **FECHA:** ${fecha_salida}\n`;
    md += `**VENTANA COMIDA:** ${ventana_comida.inicio === 'POR DEFINIR' ? 'POR DEFINIR' : `${ventana_comida.inicio} - ${ventana_comida.fin}`}\n\n`;

    md += `### ITINERARIO DE RUTA\n`;
    ruta_critica.forEach(cp => {
        const timeStr = cp.h_llegada === cp.h_salida ? cp.h_llegada : `${cp.h_llegada} - ${cp.h_salida}`;
        md += `- ${cp.es_comida ? '[COMIDA] ' : ''}${cp.localizacion}: ${timeStr}\n`;
    });

    md += `\n### AUDITORÍA DE ESTADO\n`;

    // REGLA 3+1: Máximo 3 pendientes/errores y 1 acción única
    const bloqueadores = auditoria.bloqueadores.slice(0, 3);

    if (bloqueadores.length > 0) {
        bloqueadores.forEach(b => {
            const icon = b.critico ? '❌' : '⏳';
            md += `${icon} **${b.categoria}:** ${b.mensaje}\n`;
        });
        if (auditoria.bloqueadores.length > 3) {
            md += `*(y ${auditoria.bloqueadores.length - 3} pendientes adicionales)*\n`;
        }
    } else {
        md += `✅ Sin observaciones pendientes.\n`;
    }

    md += `\n### SIGUIENTE ACCIÓN ÚNICA\n`;
    md += getNextAction(itinerario) + `\n`;

    return md;
}

export function generarReporteHTML(itinerario: ItinerarioSalida): string {
    const { auditoria, id_salida, ciudad_origen, fecha_salida, ruta_critica, ventana_comida, modo } = itinerario;

    const statusColor = {
        'BLOQUEADO': '#ff4d4d',
        'INCOMPLETO': '#ffa31a',
        'VALIDADO': '#33cc33',
        'LISTO_PARA_OPERAR': '#00ace6'
    };

    const bloqueadoresVisibles = auditoria.bloqueadores.slice(0, 3);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; color: #333; line-height: 1.5; max-width: 800px; margin: 40px auto; padding: 20px; border: 1px solid #eee; }
        .header { border-bottom: 2px solid #000; display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 5px; }
        .status-box { padding: 10px; border-radius: 4px; color: #fff; font-weight: bold; text-align: center; margin: 20px 0; background-color: ${statusColor[auditoria.estado]}; }
        .section-title { font-size: 14px; background: #eee; padding: 5px; text-transform: uppercase; font-weight: bold; margin-top: 20px; }
        .item { font-size: 14px; padding: 5px 0; border-bottom: 1px solid #f9f9f9; display: flex; justify-content: space-between; }
        .audit-card { padding: 10px; margin-top: 5px; border-radius: 3px; font-size: 13px; margin-bottom: 5px; }
        .error { background: #fff5f5; border-left: 4px solid #ff4d4d; }
        .pending { background: #fffbef; border-left: 4px solid #ffa31a; }
        .next-action { background: #000; color: #fff; padding: 10px; margin-top: 20px; font-weight: bold; font-size: 14px; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="margin:0; font-size: 20px;">Tour Odisea Challenge</h1>
        <div style="font-size: 12px; font-weight: bold;">MODO: ${modo}</div>
    </div>
    <div class="status-box">${auditoria.estado.replace(/_/g, ' ')}</div>
    
    <div style="font-size: 13px;">
        <strong>ID:</strong> ${id_salida} | <strong>ORIGEN:</strong> ${ciudad_origen} | <strong>FECHA:</strong> ${fecha_salida}
    </div>

    <div class="section-title">Itinerario Operativo</div>
    ${ruta_critica.map(cp => `
        <div class="item">
            <span>${cp.es_comida ? '🍽️ ' : ''}${cp.localizacion}</span>
            <span>${cp.h_llegada === cp.h_salida ? cp.h_llegada : `${cp.h_llegada} - ${cp.h_salida}`}</span>
        </div>`).join('')}

    <div class="section-title">Auditoría (REGLA 3+1)</div>
    ${bloqueadoresVisibles.map(b => `
        <div class="audit-card ${b.critico ? 'error' : 'pending'}">
            <strong>${b.critico ? '❌ BLOQUEO' : '⏳ PENDIENTE'}:</strong> ${b.mensaje}
        </div>
    `).join('')}
    ${auditoria.bloqueadores.length > 3 ? `<p style="font-size:11px; color:#666;">+ ${auditoria.bloqueadores.length - 3} tareas adicionales en cola.</p>` : ''}
    ${auditoria.bloqueadores.length === 0 ? '<p style="font-size:13px; color:green;">✅ Verificación completada.</p>' : ''}

    <div class="section-title">Siguiente Acción Única</div>
    <div class="next-action">${getNextAction(itinerario)}</div>
</body>
</html>
  `;
}

function getNextAction(itinerario: ItinerarioSalida): string {
    const { auditoria, ventana_comida, ruta_critica, logistica, modo } = itinerario;

    // PRIORIDAD 1: COMIDA
    if (ventana_comida.inicio === 'POR DEFINIR') {
        return `NEGOCIAR: Definir ventana horaria con proveedor de COMIDA.`;
    }

    // PRIORIDAD 2: PUNTO DE SALIDA
    if (ruta_critica[0].localizacion === "POR DEFINIR" || ruta_critica[0].localizacion === itinerario.ciudad_origen) {
        return `UBICAR: Definir punto exacto de salida para la carga de PAX.`;
    }

    // PRIORIDAD 3: CAPACIDAD
    if (logistica.capacidad_requerida <= 0) {
        return `CUANTIFICAR: Definir capacidad de PAX para seleccionar unidad.`;
    }

    // PRIORIDAD 4: HORARIOS
    if (ruta_critica.some(cp => cp.h_llegada === 'POR DEFINIR')) {
        return `PLANIFICAR: Completar horarios de la ruta crítica.`;
    }

    // PRIORIDAD 5: CERTIFICACIÓN
    if (modo === 'PLANEACIÓN') {
        return `CERTIFICAR: Solicitar auditoría final para autorizar la salida.`;
    }

    return `AUTORIZADO: Salida validada y lista para despliegue.`;
}
