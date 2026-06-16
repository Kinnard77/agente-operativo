import * as fs from 'fs';
import * as path from 'path';
import { generarBorradorItinerario } from './ingesta';
import { establecerVentanaComida, actualizarCronograma } from './operador';
import { generarPaqueteTransportistaHTML } from './paquete_transportista';

async function generate() {
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

    // 1. PLANEACIÓN
    const ingesta = {
        ciudad_origen: "Querétaro",
        fecha_salida: "2026-05-20",
        capacidad_estimada: 45
    };
    let itinerantPlanning = generarBorradorItinerario(ingesta);
    const htmlPlanning = generarPaqueteTransportistaHTML(itinerantPlanning);
    fs.writeFileSync(path.join(outputDir, 'Paquete_Transportista_QRO_PLANEACION.html'), htmlPlanning);

    // 2. CERTIFICACIÓN
    let itinerantCert = generarBorradorItinerario(ingesta);
    itinerantCert = establecerVentanaComida(itinerantCert, "13:30", "15:00");
    itinerantCert = actualizarCronograma(itinerantCert, {
        "stop-1": { l: "08:00", s: "08:15" },
        "stop-2": { l: "10:30", s: "11:00" },
        "stop-3": { l: "13:45", s: "14:45" },
        "stop-4": { l: "17:00", s: "17:30" },
        "stop-5": { l: "19:30", s: "19:30" }
    });
    itinerantCert.modo = 'CERTIFICACIÓN';
    const htmlCert = generarPaqueteTransportistaHTML(itinerantCert);
    fs.writeFileSync(path.join(outputDir, 'Paquete_Transportista_QRO_CERTIFICACION.html'), htmlCert);

    console.log("Archivos generados exitosamente en /output");
}

generate();
