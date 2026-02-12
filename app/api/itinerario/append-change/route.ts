import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
  if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const itineraryId = body?.itineraryId;
    const quien = String(body?.quien ?? "").trim();
    const cambio = String(body?.cambio ?? "").trim();

    if (!itineraryId) {
      return NextResponse.json({ ok: false, error: "Falta itineraryId" }, { status: 400 });
    }
    if (!quien || !cambio) {
      return NextResponse.json({ ok: false, error: "Falta quien o cambio" }, { status: 400 });
    }

    const supabase = getAdminSupabase();

    // 1) leer itinerario jsonb
    const { data: row, error: readErr } = await supabase
      .from("itinerario_salidas")
      .select("id,itinerario")
      .eq("id", itineraryId)
      .single();

    if (readErr || !row) {
      return NextResponse.json({ ok: false, error: readErr?.message ?? "No encontrado" }, { status: 404 });
    }

    const itinerario = row.itinerario ?? {};
    const changes = Array.isArray(itinerario.cambios_ultimo_momento) ? itinerario.cambios_ultimo_momento : [];

    const now = new Date().toISOString();
    const entry = { ts: now, quien, cambio };

    const nextItinerario = {
      ...itinerario,
      cambios_ultimo_momento: [...changes, entry],
    };

    // 2) actualizar
    const { error: upErr } = await supabase
      .from("itinerario_salidas")
      .update({ itinerario: nextItinerario, updated_at: now })
      .eq("id", itineraryId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, added: entry });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Error inesperado" }, { status: 500 });
  }
}
