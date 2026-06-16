# Carrier & Operator Packet Update Walkthrough

I have updated the Carrier Packet and implemented the new Operator Packet and Check-in Endpoint (Validation & QR).

## 1. Carrier Packet Updates
- **Last Minute Changes**: Rich structure, table layout, top positioning.
- **Sorting**: Chronological sorting, prioritizing valid times.
- **Time Formatting**: Strict ascending order (`01:00 → 06:00`).
- **Strict Logic**: Time display depends on stop type (e.g., COMIDA shows range, SALIDA shows departure).

## 2. Operator Packet (`/api/operator-packet/...`)
New endpoints for PDF and HTML generation specifically for operators.

### Features
- **Filtering**: Only shows stops where `responsable === "OPERADOR"`.
- **Validation**: Returns 409 if no operator stops exist.
- **Document Title**: "Paquete Operador".

### Operator Controls
Calculates and displays a status table for operator stops:
- **Columns**: Lugar, Objetivo, Tol (min), Check-in, Status, QR.
- **Status Logic**:
  - `PENDIENTE`: If no check-in.
  - `A_TIEMPO`: If `(checkin - objective) <= tolerance`.
  - `TARDE`: If `(checkin - objective) > tolerance`.
- **QR Code**: Links to the check-in endpoint for that specific stop.
  - **Dynamic Origin**: Uses `req.url` origin to build the URL (no hardcoded localhost).
  - **Encoding**: Properly encodes `itineraryId` and `stopId` parameters.

## 3. Operator Check-in (`/api/operator/checkin`)
New POST endpoint to register operator arrivals.

### Request Body
```json
{
  "itineraryId": "UUID",
  "stopId": "o1",
  "checkin_ts": "2026-02-11T12:34:56.000Z", // Optional, defaults to now
  "checkin_nota": "Validation note" // Optional
}
```

### Logic
- Validates `itineraryId` and `stopId`.
- Fetches `itinerario_salidas`.
- Finds stop in `ruta_critica`.
- **Validation**: Ensures `stop.responsable === "OPERADOR"`.
- Updates `checkin_ts` and `checkin_nota`.
- Saves updated itinerary back to DB.

### Response
```json
{ "ok": true, "updated": { "stopId": "...", "checkin_ts": "..." } }
```

## 4. QR Check-in (`/api/operator/checkin-qr`)
New GET endpoint for easy QR scanning.

- **URL**: `/api/operator/checkin-qr?itineraryId=...&stopId=...`
- **Logic**: Reuses the core check-in logic.
- **Response**: Returns a simple HTML success page with a link back to the Operator Packet.
- **Integration**: The Operator Packet now automatically generates and validates these QR codes for each operator stop.
