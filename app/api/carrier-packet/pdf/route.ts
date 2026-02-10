import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { renderCarrierPacketHtml } from "@/lib/carrierPacket/renderCarrierPacketHtml";

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
    const origin = new URL(req.url).origin;
    const itineraryId = searchParams.get("itineraryId");
    if (!itineraryId) {
      return NextResponse.json({ ok: false, error: "Falta itineraryId" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    const { data: row, error } = await supabase
      .from("itinerario_salidas")
      .select("id,id_salida,ciudad_origen,destino_final,fecha_salida,estado,itinerario,created_at,updated_at,transportista_id")
      .eq("id", itineraryId)
      .single();

    if (error || !row) {
      return NextResponse.json({ ok: false, error: error?.message ?? "No encontrado" }, { status: 404 });
    }

    if (row.estado !== "LISTO_PARA_OPERAR") {
      return NextResponse.json({ ok: false, error: "Itinerario no está LISTO_PARA_OPERAR" }, { status: 409 });
    }

    // Transportista (opcional)
    let carrier: any = {};
    if (row.transportista_id) {
      const { data: t } = await supabase
        .from("transportistas")
        .select('nombre,telefono,email,tipo_unidades,"capacidad_máxima"')
        .eq("id", row.transportista_id)
        .single();

      if (t) {
        carrier = {
          name: t.nombre ?? "",
          phone: t.telefono ?? "",
          email: t.email ?? "",
          vehicle: `${t.tipo_unidades ?? ""}${t["capacidad_máxima"] ? ` (${t["capacidad_máxima"]} pax)` : ""}`.trim(),
        };
      }
    }

    const rawStops = extractStops(row.itinerario);
    const stops = rawStops.map((s: any, idx: number) => {
      const isFirst = idx === 0;
      const isLast = idx === rawStops.length - 1;

      const type =
        s.es_comida ? "BREAK" : isFirst ? "PICKUP" : isLast ? "DROPOFF" : "OTHER";

      const time_local =
        s.h_llegada || s.h_salida
          ? `${s.h_llegada ?? ""}${s.h_llegada && s.h_salida ? " → " : ""}${s.h_salida ?? ""}`.trim()
          : "";

      return {
        order: idx + 1,
        type,
        title: String(s.localizacion ?? `Parada ${idx + 1}`),
        address: "",
        time_local,
        notes: s.es_comida ? "Ventana comida (rígida)" : "",
      };
    });

    const html = renderCarrierPacketHtml({
      itinerary_id: row.id,
      status: "CERTIFIED",
      created_at: row.updated_at ?? row.created_at ?? new Date().toISOString(),
      baseHref: origin,
      service: {
        brand: "Odisea Challenge",
        doc: "Paquete Transportista",
        folio: row.id_salida ?? "",
      },
      carrier,
      route: {
        city: row.ciudad_origen ?? "",
        date_local: row.fecha_salida ?? "",
        service_name: `Salida ${row.id_salida ?? ""} → ${row.destino_final ?? ""}`.trim(),
      },
      mission: {
        origen: row.ciudad_origen ?? "",
        destino: row.destino_final ?? "",
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
      stops,
    });

    // HTML -> PDF
    const browser = await puppeteer.launch({ headless: "new" });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "12mm", right: "12mm", bottom: "12mm", left: "12mm" },
      });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Paquete-Transportista-${row.id_salida ?? row.id}.pdf"`,
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
