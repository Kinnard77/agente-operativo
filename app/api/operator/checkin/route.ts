import { NextResponse } from "next/server";
import { processOperatorCheckin } from "@/lib/operator/checkinLogic";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { itineraryId, stopId, checkin_nota } = body;
        let { checkin_ts } = body;

        // 1) Validaciones básicas
        if (!itineraryId) {
            return NextResponse.json({ ok: false, error: "Falta itineraryId" }, { status: 400 });
        }
        if (!stopId) {
            return NextResponse.json({ ok: false, error: "Falta stopId" }, { status: 400 });
        }

        // Default checkin_ts
        if (!checkin_ts) {
            checkin_ts = new Date().toISOString();
        }

        const updated = await processOperatorCheckin(itineraryId, stopId, checkin_ts, checkin_nota);

        return NextResponse.json({ ok: true, updated });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message ?? "Error inesperado" }, { status: 500 });
    }
}
