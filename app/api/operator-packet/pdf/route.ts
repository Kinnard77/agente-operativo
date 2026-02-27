import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { renderCarrierPacketHtml } from "@/lib/carrierPacket/renderCarrierPacketHtml";
import QRCode from "qrcode";
import { DESTINO_FIJO } from "@/blueprint";

export const runtime = "nodejs";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
    return createClient(url, key, { auth: { persistSession: false } });
}

function extractStops(itinerario: any): any[] {
    if (!itinerario) return [];
    if (Array.isArray(itinerario)) return itinerario;
    const candidates = [
        itinerario.ruta_critica,
        itinerario.stops,
        itinerario.paradas,
        itinerario.route,
        itinerario.puntos,
        itinerario.steps,
    ];
    for (const c of candidates) if (Array.isArray(c)) return c;
    return [];
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
        const xfProto = req.headers.get("x-forwarded-proto");

        const isLocalHost = host.includes("localhost") || host.startsWith("127.");
        const isPrivateIp = host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.");

        const proto = xfProto ?? ((isLocalHost || isPrivateIp) ? "http" : "https");
        const origin = `${proto}://${host}`;
        const itineraryId = searchParams.get("itineraryId");
        if (!itineraryId) {
            return NextResponse.json({ ok: false, error: "Falta itineraryId" }, { status: 400 });
        }

        const supabase = getAdminSupabase();

        const { data: row, error } = await supabase
            .from("itinerario_salidas")
            .select("id,id_salida,ciudad_origen,fecha_salida,estado,itinerario,created_at,updated_at,transportista_id")
            .eq("id", itineraryId)
            .single();

        if (error || !row) {
            return NextResponse.json({ ok: false, error: error?.message ?? "No encontrado" }, { status: 404 });
        }

        if (row.estado !== "LISTO_PARA_OPERAR") {
            return NextResponse.json({ ok: false, error: "Itinerario no está LISTO_PARA_OPERAR" }, { status: 409 });
        }

        // --- Validacion minimos operativos ---
        const missing: string[] = [];
        if (!row.transportista_id) missing.push("transportista_id");
        const rutaCritica = Array.isArray(row.itinerario?.ruta_critica) ? row.itinerario.ruta_critica : [];
        if (rutaCritica.length < 2) missing.push("itinerario.ruta_critica (min 2 paradas)");
        const capReq = row.itinerario?.logistica?.capacidad_requerida;
        if (!capReq || Number(capReq) <= 0) missing.push("itinerario.logistica.capacidad_requerida");

        // Validar ventanas de comida si aplica
        const stopsForCheck = extractStops(row.itinerario);
        const hasFoodCheck = stopsForCheck.some((s: any) => s.es_comida);
        if (hasFoodCheck) {
            if (!row.itinerario?.ventana_comida?.inicio) missing.push("itinerario.ventana_comida.inicio");
            if (!row.itinerario?.ventana_comida?.fin) missing.push("itinerario.ventana_comida.fin");
        }

        if (missing.length > 0) {
            console.warn(`[OperatorPacket-PDF] Validation Failed for ${itineraryId}:`, missing);
            return NextResponse.json({
                ok: false,
                error: "Datos incompletos para Paquete Operador",
                missing,
                hint: "Asigna transportista_id en itinerario_salidas y define logistica.capacidad_requerida en itinerario jsonb."
            }, { status: 409 });
        }

        // Transportista (opcional)
        let carrier: any = {};
        if (row.transportista_id) {
            const { data: t } = await supabase
                .from("transportistas")
                .select('nombre,telefono,email,tipo_unidades,"capacidad_maxima"')
                .eq("id", row.transportista_id)
                .single();

            if (!t) { // Check if transportista query returned no data
                console.warn(`[OperatorPacket-PDF] Transportista not found: ${row.transportista_id}`);
                return NextResponse.json({
                    ok: false,
                    error: "Datos incompletos para Paquete Operador",
                    missing: ["transportista (db record not found)"],
                    hint: "El ID del transportista existe en itinerario pero no en la tabla transportistas."
                }, { status: 409 });
            }

            if (t) {
                carrier = {
                    name: t.nombre ?? "",
                    phone: t.telefono ?? "",
                    email: t.email ?? "",
                    vehicle: `${t.tipo_unidades ?? ""}${t["capacidad_maxima"] ? ` (${t["capacidad_maxima"]} pax)` : ""}`.trim(),
                };
            }
        }

        const rawStops = extractStops(row.itinerario);

        // Filtrar stops operador
        const operatorStops = (rawStops || []).filter((s: any) => s?.responsable === "OPERADOR");

        if (operatorStops.length === 0) {
            return NextResponse.json({ ok: false, error: "No hay paradas OPERADOR en ruta_critica" }, { status: 409 });
        }

        // Construir tabla de control del Operador
        const operator_controls = await Promise.all(operatorStops.map(async (s: any) => {
            const objetivo = String(s.hora_objetivo ?? "").trim();
            const tol = Number(s.tolerancia_min ?? 0);
            const checkin = s.checkin_ts ? String(s.checkin_ts) : "";

            // status simple (si no hay checkin => PENDIENTE)
            let status = "PENDIENTE";
            if (checkin && objetivo) {
                // calculo en minutos HH:MM vs HH:MM (simple, mismo día)
                const toMin = (hhmm: string) => {
                    const [h, m] = hhmm.split(":").map((x) => parseInt(x, 10));
                    return (h * 60) + m;
                };
                const checkinTime = checkin.length >= 16 ? checkin.slice(11, 16) : checkin;
                const delta = toMin(checkinTime) - toMin(objetivo);
                status = delta <= tol ? "A_TIEMPO" : "TARDE";
            }

            // Generate QR
            // Link explícito a checkin-qr endpoint, usando origin dinámico y encoding
            const checkinQrUrl = `${origin}/api/operator/checkin-qr?itineraryId=${encodeURIComponent(itineraryId)}&stopId=${encodeURIComponent(s.id)}`;
            const qr = await QRCode.toDataURL(checkinQrUrl, { margin: 1, width: 128 });

            return {
                lugar: String(s.localizacion ?? ""),
                objetivo,
                tolerancia_min: tol || "",
                checkin_ts: checkin,
                status,
                qr
            };
        }));

        // Ordenar por hora (ascendente), dejando sin hora al final
        const getTimeKey = (s: any) => (s?.h_llegada || s?.h_salida || "").trim();

        operatorStops.sort((a: any, b: any) => {
            const ta = getTimeKey(a);
            const tb = getTimeKey(b);

            const aHas = !!ta;
            const bHas = !!tb;

            if (aHas && bHas) return ta.localeCompare(tb);
            if (aHas && !bHas) return -1; // a primero
            if (!aHas && bHas) return 1;  // b primero
            return 0;
        });

        const stops = operatorStops.map((s: any, idx: number) => {
            const isFirst = idx === 0;
            const isLast = idx === operatorStops.length - 1;

            const tipoReal =
                s.tipo ??
                (s.es_comida ? "COMIDA" : undefined) ??
                (isFirst ? "SALIDA" : undefined) ??
                (isLast ? "LLEGADA" : "CHECKPOINT");

            const type =
                tipoReal === "COMIDA" ? "BREAK"
                    : (tipoReal === "SALIDA" ? "PICKUP"
                        : (tipoReal === "LLEGADA" ? "DROPOFF"
                            : "OTHER"));

            const salida = String(s.h_salida ?? "").trim();
            const llegada = String(s.h_llegada ?? "").trim();

            let time_local = "";

            // Semántica estricta por tipo
            if (tipoReal === "COMIDA") {
                // inicio → fin
                time_local = (llegada && salida) ? `${llegada} → ${salida}` : (llegada || salida);
            } else if (tipoReal === "SALIDA" || tipoReal === "REGRESO") {
                time_local = salida || llegada; // preferimos salida
            } else if (tipoReal === "LLEGADA") {
                time_local = llegada || salida; // preferimos llegada
            } else {
                // ENTRADA / CHECKPOINT / TECNICA / EMERGENCIA
                time_local = llegada || salida; // preferimos llegada
            }

            const flags: string[] = [];
            if (!time_local) flags.push("SIN HORA");
            if (s.es_rigido === true) flags.push("RÍGIDO");
            if (s.es_aproximado === true) flags.push("APROX");
            if (tipoReal === "EMERGENCIA") flags.push("SOLO EMERGENCIA");

            const notesParts = [
                flags.length ? `[${flags.join(" · ")}]` : null,
                tipoReal ? `Tipo: ${tipoReal}` : null,
                s.nota ?? null,
            ].filter(Boolean);

            return {
                order: idx + 1,
                type,
                title: String(s.localizacion ?? `Parada ${idx + 1}`),
                address: "",
                time_local,
                notes: notesParts.join(" — "),
            };
        });

        const html = renderCarrierPacketHtml({
            itinerary_id: row.id,
            status: "CERTIFIED",
            created_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
            baseHref: origin,
            service: {
                brand: "Odisea Challenge",
                doc: "Paquete Operador",
                folio: row.id_salida ?? "",
            },
            carrier,
            route: {
                city: row.ciudad_origen ?? "",
                date_local: row.fecha_salida ?? "",
                service_name: `Salida ${row.id_salida ?? ""} → ${DESTINO_FIJO}`.trim(),
            },
            mission: {
                origen: row.ciudad_origen ?? "",
                destino: DESTINO_FIJO,
                pax_requerida: row.itinerario?.logistica?.capacidad_requerida ?? "",
                ventana_comida_inicio: row.itinerario?.ventana_comida?.inicio ?? "",
                ventana_comida_fin: row.itinerario?.ventana_comida?.fin ?? "",
                hora_inicio: Array.isArray(row.itinerario?.ruta_critica) ? (row.itinerario.ruta_critica?.[0]?.h_salida ?? row.itinerario.ruta_critica?.[0]?.h_llegada ?? "") : "",
                hora_fin: Array.isArray(row.itinerario?.ruta_critica) ? (row.itinerario.ruta_critica?.[row.itinerario.ruta_critica.length - 1]?.h_llegada ?? row.itinerario.ruta_critica?.[row.itinerario.ruta_critica.length - 1]?.h_salida ?? "") : "",
            },
            audit: {
                estado: row.itinerario?.auditoria?.estado,
                bloqueadores: row.itinerario?.auditoria?.bloqueadores,
            },
            changes: (row.itinerario?.cambios_ultimo_momento ?? []) as any[],
            operator_controls: operator_controls,
            stops: stops as any[],
        });

        // HTML -> PDF
        const browser = await puppeteer.launch({ headless: true });
        try {
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: "networkidle0" });

            const pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
            });

            return new NextResponse(Buffer.from(pdfBuffer), {
                status: 200,
                headers: {
                    "Content-Type": "application/pdf",
                    "Content-Disposition": `attachment; filename="Paquete-Operador-${row.id_salida ?? row.id}.pdf"`,
                    "Cache-Control": "no-store",
                },
            });
        } finally {
            await browser.close();
        }
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "Error inesperado" }, { status: 500 });
    }
}
