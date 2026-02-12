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

function getOrigin(req: Request) {
  const host =
    req.headers.get("x-forwarded-host") ??
    req.headers.get("host") ??
    "localhost:3000";

  const xfProto = req.headers.get("x-forwarded-proto");

  const isLocalHost = host.includes("localhost") || host.startsWith("127.");
  const isPrivateIp =
    host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.");

  const proto = xfProto ?? ((isLocalHost || isPrivateIp) ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const itineraryId = url.searchParams.get("itineraryId")?.trim();
    const stopId = url.searchParams.get("stopId")?.trim();

    if (!itineraryId || !stopId) {
      return NextResponse.json(
        { ok: false, error: "Faltan itineraryId o stopId" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    const { data: row, error: readErr } = await supabase
      .from("itinerario_salidas")
      .select("id,itinerario")
      .eq("id", itineraryId)
      .single();

    if (readErr || !row) {
      return NextResponse.json(
        { ok: false, error: readErr?.message ?? "Itinerario no encontrado" },
        { status: 404 }
      );
    }

    const itinerario: any = row.itinerario ?? {};
    const ruta = Array.isArray(itinerario.ruta_critica) ? itinerario.ruta_critica : [];

    const idx = ruta.findIndex((s: any) => String(s?.id ?? "") === stopId);
    if (idx === -1) {
      return NextResponse.json(
        { ok: false, error: "stopId no existe en ruta_critica" },
        { status: 404 }
      );
    }

    const stop = ruta[idx];
    if (stop?.responsable !== "OPERADOR") {
      return NextResponse.json(
        { ok: false, error: "Este stop no pertenece a OPERADOR" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const nextStop = {
      ...stop,
      checkin_ts: stop.checkin_ts ?? now, // no sobreescribe si ya existe
      checkin_nota: stop.checkin_nota ?? null,
    };

    const nextRuta = [...ruta];
    nextRuta[idx] = nextStop;

    const nextItinerario = { ...itinerario, ruta_critica: nextRuta };

    const { error: upErr } = await supabase
      .from("itinerario_salidas")
      .update({ itinerario: nextItinerario, updated_at: now })
      .eq("id", itineraryId);

    if (upErr) {
      return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
    }

    const origin = getOrigin(req);
    const packetUrl =
      `${origin}/api/operator-packet/html?itineraryId=${encodeURIComponent(itineraryId)}`;

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Check-in registrado</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; line-height:1.4;}
    .card{max-width:640px;margin:0 auto;border:1px solid #ddd;border-radius:12px;padding:16px;}
    .ok{font-weight:700;margin-bottom:8px;}
    a.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:10px;text-decoration:none;border:1px solid #111;}
    .muted{color:#555;font-size:13px;margin-top:10px}
    code{background:#f5f5f5;padding:2px 6px;border-radius:6px}
  </style>
</head>
<body>
  <div class="card">
    <div class="ok">✅ Check-in registrado</div>
    <div>Se ha registrado tu llegada correctamente.</div>
    <a class="btn" href="${packetUrl}">Ver Paquete Operador</a>
    <div class="muted">Stop: <code>${stopId}</code></div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Error inesperado" },
      { status: 500 }
    );
  }
}
