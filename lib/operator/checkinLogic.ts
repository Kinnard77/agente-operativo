import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url) throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
    if (!key) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
    return createClient(url, key, { auth: { persistSession: false } });
}

export async function processOperatorCheckin(itineraryId: string, stopId: string, checkin_ts?: string, checkin_nota?: string) {
    if (!itineraryId) throw new Error("Falta itineraryId");
    if (!stopId) throw new Error("Falta stopId");

    // Default checkin_ts
    const finalTs = checkin_ts || new Date().toISOString();

    const supabase = getAdminSupabase();

    // 2) Leer fila itinerario_salidas
    const { data: row, error } = await supabase
        .from("itinerario_salidas")
        .select("id, itinerario")
        .eq("id", itineraryId)
        .single();

    if (error || !row) throw new Error(error?.message ?? "Itinerario no encontrado");

    const itinerario = row.itinerario || {};
    const stops = Array.isArray(itinerario.ruta_critica) ? itinerario.ruta_critica : [];

    // 3) Buscar stop y actualizar
    let updatedStop: any = null;
    let stopFound = false;

    for (const s of stops) {
        if (s.id === stopId) {
            if (s.responsable !== "OPERADOR") {
                throw new Error(`El stop ${stopId} no es responsabilidad OPERADOR`);
            }

            // Update fields
            s.checkin_ts = finalTs;
            if (checkin_nota !== undefined) {
                s.checkin_nota = checkin_nota;
            }

            updatedStop = { stopId, checkin_ts: finalTs, checkin_nota };
            stopFound = true;
            break;
        }
    }

    if (!stopFound) throw new Error(`Stop ${stopId} no encontrado en ruta_critica`);

    if (!Array.isArray(itinerario.ruta_critica)) {
        itinerario.ruta_critica = stops;
    }

    const { error: updateError } = await supabase
        .from("itinerario_salidas")
        .update({ itinerario, updated_at: new Date().toISOString() })
        .eq("id", itineraryId);

    if (updateError) throw new Error(updateError.message);

    return updatedStop;
}
