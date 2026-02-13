import { ItinerarioSalida } from './blueprint';

/**
 * @file paquete_transportista.ts
 * @description Generador de documentación corporativa para el transportista.
 */

export interface DatosCarrier {
    contacto_operativo: string;
}

/**
 * @function generarPaqueteTransportistaHTML
 * Genera un documento HTML listo para PDF para el transportista.
 */
export function generarPaqueteTransportistaHTML(itinerario: ItinerarioSalida, carrier?: DatosCarrier): string {
    const { id_salida, ciudad_origen, fecha_salida, logistica, ruta_critica, ventana_comida, modo } = itinerario;

    const contacto = carrier?.contacto_operativo || "POR ASIGNAR (Contacto Odisea)";
    const esPlaneacion = modo === 'PLANEACIÓN';
    const comidaPorDefinir = ventana_comida.inicio === 'POR DEFINIR';

    const titulo = esPlaneacion
        ? "SOLICITUD DE COTIZACIÓN / DISPONIBILIDAD PARA TRANSPORTISTA"
        : "INSTRUCCIONES DE OPERACIÓN PARA TRANSPORTISTA";

    const sello = esPlaneacion
        ? "USO EXTERNO — COTIZACIÓN"
        : "USO EXTERNO AUTORIZADO";

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Arial', sans-serif; color: #333; line-height: 1.4; max-width: 900px; margin: 0 auto; padding: 40px; }
        .header { border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
        .header h1 { margin: 0; font-size: 24px; color: #000; }
        .header .confidential { color: #cc0000; font-weight: bold; font-size: 12px; border: 2px solid #cc0000; padding: 5px; text-align: center; }
        
        .summary-box { background: #f9f9f9; border: 1px solid #ddd; padding: 20px; margin-bottom: 30px; border-radius: 5px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 14px; }
        
        .section-title { background: #000; color: #fff; padding: 8px 15px; margin-top: 40px; margin-bottom: 15px; text-transform: uppercase; font-size: 16px; font-weight: bold; }
        
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px; }
        th { background-color: #f2f2f2; border: 1px solid #ddd; padding: 12px; text-align: left; }
        td { border: 1px solid #ddd; padding: 12px; }
        .comida-highlight { background-color: #fff9e6; font-weight: bold; }
        
        .responsibilities-list { list-style: none; padding: 0; }
        .responsibilities-list li { margin-bottom: 10px; padding-left: 25px; position: relative; }
        .responsibilities-list li:before { content: "▪"; position: absolute; left: 0; color: #000; }
        
        .confirmation-table { width: 100%; border: 2px solid #000; margin-top: 30px; }
        .confirmation-table td { padding: 15px; font-size: 13px; }
        .checkbox-cell { width: 30px; text-align: center; font-size: 20px; border-right: none; }
        .label-cell { border-left: none; }
        
        .footer { margin-top: 60px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #eee; padding-top: 15px; }
        .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 80px; text-align: center; padding-top: 10px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <h1>Tour Odisea Challenge</h1>
            <p><strong>${titulo}</strong></p>
        </div>
        <div class="confidential">${sello}</div>
    </div>

    <div class="summary-box">
        <div class="summary-grid">
            <div><strong>ID DE SALIDA:</strong> ${id_salida}</div>
            <div><strong>FECHA DE SERVICIO:</strong> ${fecha_salida}</div>
            <div><strong>CIUDAD ORIGEN:</strong> ${ciudad_origen}</div>
            <div><strong>CAPACIDAD REQUERIDA:</strong> ${logistica.capacidad_requerida} PAX</div>
            <div><strong>CONTACTO OPERATIVO:</strong> ${contacto}</div>
        </div>
    </div>

    <div class="section-title">I. Itinerario Detallado del Servicio</div>
    <table>
        <thead>
            <tr>
                <th>Parada / Punto de Control</th>
                <th>Horario de Llegada</th>
                <th>Horario de Salida</th>
                <th>Observaciones</th>
            </tr>
        </thead>
        <tbody>
            ${ruta_critica.map(cp => {
        const isComida = cp.es_comida;
        return `
                <tr class="${isComida ? 'comida-highlight' : ''}">
                    <td>${isComida ? '' : ''}${cp.localizacion}</td>
                    <td>${cp.h_llegada}</td>
                    <td>${cp.h_salida}</td>
                    <td>${isComida ? `<strong>Parada Rígida.</strong> ${comidaPorDefinir ? 'Ventana por definir' : `Ventana: ${ventana_comida.inicio} - ${ventana_comida.fin}`}` : '-'}</td>
                </tr>`;
    }).join('')}
        </tbody>
    </table>

    <div class="section-title">II. Responsabilidades del Transportista</div>
    <ul class="responsibilities-list">
        <li><strong>Puntualidad:</strong> Cumplimiento estricto de los horarios acordados en el itinerario. Se requiere presencia en el punto de origen 30 minutos antes de la hora de salida.</li>
        <li><strong>Seguros de Viajero:</strong> Contar con seguros de viajero vigentes y con cobertura completa durante toda la operación del servicio.</li>
    </ul>

    <div class="section-title">III. Confirmación de Disponibilidad y Compromiso</div>
    <table class="confirmation-table">
        <tr>
            <td class="checkbox-cell">☐</td>
            <td class="label-cell">Disponibilidad para fecha y capacidad solicitada.</td>
            <td class="checkbox-cell">☐</td>
            <td class="label-cell">Seguro de viajero vigente (declaración o folio).</td>
        </tr>
        <tr>
            <td class="checkbox-cell">☐</td>
            <td class="label-cell">Contacto de coordinación del servicio (nombre y teléfono).</td>
            <td class="checkbox-cell">☐</td>
            <td class="label-cell">Compromiso de puntualidad (aceptación de horarios cuando estén definidos).</td>
        </tr>
    </table>

    <div style="display: flex; justify-content: space-around; margin-top: 50px;">
        <div class="signature-line">Firma del Transportista</div>
        <div class="signature-line">Sello de Odisea Challenge</div>
    </div>

    <div class="footer">
        Paquete Corporativo de Operación | v1.2 MVP | Confidencial Interno/Externo
    </div>
</body>
</html>
  `;
}

/**
 * @function generarPaqueteTransportistaMarkdown
 * Versión Markdown simplificada.
 */
export function generarPaqueteTransportistaMarkdown(itinerario: ItinerarioSalida): string {
    const { id_salida, ciudad_origen, fecha_salida, logistica, ruta_critica, modo } = itinerario;
    const esPlaneacion = modo === 'PLANEACIÓN';

    let md = `# ${esPlaneacion ? 'COTIZACIÓN' : 'INSTRUCCIONES'} PARA TRANSPORTISTA: TOUR ODISEA CHALLENGE\n\n`;
    md += `**ID:** ${id_salida} | **FECHA:** ${fecha_salida}\n`;
    md += `**ORIGEN:** ${ciudad_origen} | **CAPACIDAD:** ${logistica.capacidad_requerida} PAX\n\n`;

    md += `### ITINERARIO DE SERVICIO\n`;
    ruta_critica.forEach(cp => {
        md += `- ${cp.es_comida ? '[PARADA RÍGIDA] ' : ''}${cp.localizacion}: ${cp.h_llegada} - ${cp.h_salida}\n`;
    });

    md += `\n### RESPONSABILIDADES\n`;
    md += `- **Puntualidad:** Cumplimiento de horarios.\n`;
    md += `- **Seguros de Viajero:** Cobertura vigente.\n\n`;

    return md;
}
