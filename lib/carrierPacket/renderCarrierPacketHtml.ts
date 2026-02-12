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

  mission?: {
    origen?: string;
    destino?: string;
    pax_requerida?: number | string;
    ventana_comida_inicio?: string;
    ventana_comida_fin?: string;
    hora_inicio?: string;
    hora_fin?: string;
  };

  changes?: { ts?: string; quien?: string; cambio?: string }[];

  operator_controls?: {
    lugar: string;
    objetivo: string;
    tolerancia_min: any;
    checkin_ts: string;
    status: string;
    qr?: string;
  }[];



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

  const operatorControls = input.operator_controls ?? [];
  const operatorControlsHtml = operatorControls.length
    ? `<div class="card">
      <div class="k">Control Operador</div>
      <table style="margin-top:8px;">
        <thead>
          <tr>
            <th>Lugar</th>
            <th>Objetivo</th>
            <th>Tol (min)</th>
            <th>Check-in</th>
            <th>Status</th>
            <th>QR</th>
          </tr>
        </thead>
        <tbody>
          ${operatorControls.map(c => `
            <tr>
              <td>${esc(c.lugar)}</td>
              <td class="mono">${esc(c.objetivo)}</td>
              <td class="mono">${esc(c.tolerancia_min)}</td>
              <td class="mono">${esc(c.checkin_ts ? c.checkin_ts.substring(11, 16) : "")}</td>
              <td><strong>${esc(c.status)}</strong></td>
              <td style="text-align:center;">
                 ${c.qr ? `<img src="${c.qr}" style="width:64px;height:64px;display:block;margin:0 auto;">` : ""}
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`
    : "";

  const carrierHtml = (input.carrier?.name || input.carrier?.phone || input.carrier?.email || input.carrier?.vehicle)
    ? `<div class="card">
        <div class="k">Datos del transportista</div>
        <div class="grid" style="margin-top:8px;">
          <div>
            <div class="k">Transportista</div><div class="v"><strong>${esc(input.carrier?.name || "")}</strong></div>
            <div class="k">Unidad</div><div class="v">${esc(input.carrier?.vehicle || "")}</div>
          </div>
          <div>
            <div class="k">Teléfono</div><div class="v">${esc(input.carrier?.phone || "")}</div>
            <div class="k">Email</div><div class="v">${esc(input.carrier?.email || "")}</div>
          </div>
        </div>
      </div>`
    : "";

  const mission = input.mission || {};
  const missionHtml = `<div class="card">
    <div class="k">Resumen de misión</div>

    <div class="grid" style="margin-top:8px;">
      <div>
        <div class="k">Origen → Destino</div>
        <div class="v"><strong>${esc(mission.origen || "")}</strong> → <strong>${esc(mission.destino || "")}</strong></div>

        <div class="k" style="margin-top:8px;">PAX requerida</div>
        <div class="v">${esc(mission.pax_requerida ?? "")}</div>
      </div>

      <div>
        <div class="k">Horario</div>
        <div class="v">${esc(mission.hora_inicio || "")}${mission.hora_inicio && mission.hora_fin ? " → " : ""}${esc(mission.hora_fin || "")}</div>

        <div class="k" style="margin-top:8px;">Ventana comida</div>
        <div class="v">${esc(mission.ventana_comida_inicio || "")}${mission.ventana_comida_inicio && mission.ventana_comida_fin ? " → " : ""}${esc(mission.ventana_comida_fin || "")}</div>
      </div>
    </div>
  </div>`;

  // Cambios de último momento: siempre mostrar el bloque (aunque no haya cambios)
  // para que Operaciones tenga un espacio visible y el PDF sea verificable.
  const changes = input.changes ?? [];
  const changesHtml = `<div class="card">
      <div class="k">Cambios de último momento</div>
      ${changes.length
      ? `<table style="margin-top:8px;">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Quién</th>
                <th>Cambio</th>
              </tr>
            </thead>
            <tbody>
              ${changes
        .map(
          (c) => `<tr>
                    <td class="mono">${esc(c.ts || "")}</td>
                    <td>${esc(c.quien || "")}</td>
                    <td>${esc(c.cambio || "")}</td>
                  </tr>`
        )
        .join("")}
            </tbody>
          </table>`
      : `<div class="muted" style="margin-top:8px;">Sin cambios registrados.</div>`}
    </div>`;

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"/>
  ${input.baseHref ? `<base href="${esc(input.baseHref)}">` : ""}
  <title>Paquete Transportista</title>
</head>
<body>
  <div class="card" style="text-align:center;">
    <div style="display:flex; justify-content:center; margin-bottom:10px;">
      <img
        src="/brand/odisea-challenge.png"
        alt="Odisea Challenge"
        style="width:160px; height:auto; display:block;"
      />
    </div>

    <div style="font-size:20px; font-weight:800;">
      ${esc(input.service?.doc || "Paquete Transportista")}
    </div>

    <div class="muted" style="margin-top:6px;">
      <strong>${esc(input.service?.brand || "Odisea Challenge")}</strong>
      ${input.service?.folio ? ` • Folio: <span class="mono">${esc(input.service.folio)}</span>` : ""}
    </div>

    <div class="muted" style="margin-top:2px;">
      ${esc(input.route?.city || "")}
      ${input.route?.date_local ? ` • ${esc(input.route.date_local)}` : ""}
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

  ${changesHtml}
  ${operatorControlsHtml}
  ${carrierHtml}
  ${missionHtml}

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
