import { NextResponse } from "next/server";
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

// Extrae stops desde tu jsonb `itinerario` de forma tolerante
function extractStops(itinerario: any): any[] {
  if (!itinerario) return [];

  // Caso 1: itinerario ya es un array de paradas
  if (Array.isArray(itinerario)) return itinerario;

  // Caso 2: itinerario es objeto con posibles llaves
  const candidates = [
    itinerario.ruta_critica, // ✅ tu formato real
    itinerario.stops,
    itinerario.paradas,
    itinerario.route,
    itinerario.puntos,
    itinerario.steps,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }

  return [];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const origin = new URL(req.url).origin;

    // Usamos el uuid `id` como itineraryId
    const itineraryId = searchParams.get("itineraryId");
    if (!itineraryId) {
      return NextResponse.json(
        { ok: false, error: "Falta itineraryId (uuid id)" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data: row, error } = await supabase
      .from("itinerario_salidas")
      .select(
        "id,id_salida,ciudad_origen,destino_final,fecha_salida,modo,estado,itinerario,created_at,updated_at,transportista_id"
      )
      .eq("id", itineraryId)
      .single();

    if (error || !row) {
      return NextResponse.json(
        { ok: false, error: error?.message ?? "No encontrado" },
        { status: 404 }
      );
    }

    if (row.estado !== "LISTO_PARA_OPERAR") {
      return NextResponse.json(
        { ok: false, error: "Itinerario no está LISTO_PARA_OPERAR" },
        { status: 409 }
      );
    }

    // Cargar transportista (si está asignado)
    let carrier: {
      name?: string;
      phone?: string;
      email?: string;
      vehicle?: string;
      plates?: string;
    } = {};

    if (row.transportista_id) {
      const { data: tData, error: tErr } = await supabase
        .from("transportistas")
        .select(
          "id,nombre,contacto,telefono,email,tipo_unidades,capacidad_máxima,estado,fecha_certificacion,notas"
        )
        .eq("id", row.transportista_id)
        .single();

      if (!tErr && tData) {
        carrier = {
          name: tData.nombre ?? "",
          phone: tData.telefono ?? "",
          email: tData.email ?? "",
          vehicle: `${tData.tipo_unidades ?? ""}${tData.capacidad_máxima ? ` (${tData.capacidad_máxima} pax)` : ""
            }`.trim(),
        };
      }
    }

    const rawStops = extractStops(row.itinerario);

    // Normalizamos paradas (tu formato real)
    const stops = rawStops.map((s: any, idx: number) => {
      const isFirst = idx === 0;
      const isLast = idx === rawStops.length - 1;

      const type =
        s.es_comida
          ? "BREAK"
          : isFirst
            ? "PICKUP"
            : isLast
              ? "DROPOFF"
              : "OTHER";

      const time_local =
        s.h_llegada || s.h_salida
          ? `${s.h_llegada ?? ""}${s.h_llegada && s.h_salida ? " → " : ""
            }${s.h_salida ?? ""}`.trim()
          : "";

      return {
        order: idx + 1,
        type,
        title: String(
          s.localizacion ??
          s.title ??
          s.titulo ??
          s.nombre ??
          `Parada ${idx + 1}`
        ),
        address: "", // en tu JSON no viene dirección separada, solo "localizacion"
        time_local,
        notes: s.es_comida ? "Ventana comida (rígida)" : "",
      };
    });

    const html = renderCarrierPacketHtml({
      itinerary_id: row.id, // uuid real
      status: "CERTIFIED", // el renderer exige este literal (interno)
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

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}
