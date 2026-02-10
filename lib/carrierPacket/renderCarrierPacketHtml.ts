// lib/carrierPacket/renderCarrierPacketHtml.ts

type Stop = {
  order: number;
  type: "PICKUP" | "DROPOFF" | "BREAK" | "OTHER";
  title: string;
  address?: string;
  time_local?: string;
  notes?: string;
};

type CarrierPacketInput = {
  itinerary_id: string;
  status: "CERTIFIED";
  created_at?: string;
  baseHref?: string;

  service?: {
    doc?: string;
    brand?: string;
    folio?: string;
  };

  carrier?: {
    name?: string;
    phone?: string;
    email?: string;
    vehicle?: string;
  };

  route?: {
    city?: string;
    date_local?: string;
    service_name?: string;
  };

  pax?: {
    total?: number;
    special_notes?: string;
  };

  emergency?: {
    contact_name?: string;
    contact_phone?: string;
  };

  audit?: {
    estado?: string;
    bloqueadores?: { critico?: boolean; categoria?: string; mensaje?: string }[];
  };

  stops: Stop[];
};

const esc = (s: any) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export function renderCarrierPacketHtml(
  input: CarrierPacketInput
): string {
  if (input.status !== "CERTIFIED") {
    throw new Error("CarrierPacket requiere itinerary CERTIFIED.");
  }

  const stopsRows = input.stops
    .sort((a, b) => a.order - b.order)
    .map(
      (s) => `
      <tr>
        <td>${esc(s.order)}</td>
        <td><strong>${esc(s.type)}</strong><br>${esc(s.title)}</td>
        <td>${esc(s.time_local || "")}</td>
        <td>${esc(s.address || "")}</td>
        <td>${esc(s.notes || "")}</td>
      </tr>`
    )
    .join("");

  const bloqueadores = input.audit?.bloqueadores ?? [];
  const auditHtml = bloqueadores.length
    ? `<div class="card">
        <div class="k">Auditoría</div>
        <div class="v"><strong>${esc(input.audit?.estado || "")}</strong></div>
        <table>
          <thead>
            <tr>
              <th>Crítico</th>
              <th>Categoría</th>
              <th>Bloqueador</th>
            </tr>
          </thead>
          <tbody>
            ${bloqueadores
      .map(
        (b) => `<tr>
                          <td>${b.critico ? "Sí" : "No"}</td>
                          <td>${esc(b.categoria || "")}</td>
                          <td>${esc(b.mensaje || "")}</td>
                        </tr>`
      )
      .join("")}
          </tbody>
        </table>
      </div>`
    : "";

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  ${input.baseHref ? `<base href="${esc(input.baseHref)}">` : ""}
  <title>Paquete Transportista</title>
</head>
<body>
  <div class="card" style="display:flex; gap:14px; align-items:center;">
    <div style="width:120px; flex:0 0 auto;">
      <img src="/brand/odisea-challenge.png" alt="Odisea Challenge" style="width:120px; height:auto; display:block;" />
    </div>

    <div style="flex:1 1 auto;">
      <div style="font-size:18px; font-weight:700;">
        ${esc(input.service?.doc || "Paquete Transportista")}
      </div>

      <div class="muted" style="margin-top:4px;">
        <strong>${esc(input.service?.brand || "Odisea Challenge")}</strong>
        ${input.service?.folio ? ` • Folio: <span class="mono">${esc(input.service.folio)}</span>` : ""}
      </div>

      <div class="muted" style="margin-top:2px;">
        ${esc(input.route?.city || "")}
        ${input.route?.date_local ? ` • ${esc(input.route.date_local)}` : ""}
      </div>
    </div>
  </div>
  <div class="card">
    <div class="grid">
      <div>
        <div class="k">Documento</div><div class="v"><strong>Paquete Transportista</strong></div>
        <div class="k">Itinerario</div><div class="v mono">${esc(input.itinerary_id)}</div>
      </div>
      <div>
        <div class="k">Estado operativo</div><div class="v"><strong>LISTO_PARA_OPERAR</strong></div>
        <div class="k">Generado</div><div class="v">${esc(input.created_at || "")}</div>
      </div>
    </div>
  </div>

  ${auditHtml}

  <table border="1" cellpadding="6" cellspacing="0">
    <thead>
      <tr>
        <th>#</th>
        <th>Tipo</th>
        <th>Hora</th>
        <th>Dirección</th>
        <th>Notas</th>
      </tr>
    </thead>
    <tbody>
      ${stopsRows}
    </tbody>
  </table>
</body>
</html>`;
}
