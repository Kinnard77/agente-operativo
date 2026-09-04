import { renderCarrierPacketHtml } from "../lib/carrierPacket/renderCarrierPacketHtml";

const html = renderCarrierPacketHtml({
  itinerary_id: "it_test_001",
  status: "CERTIFIED",
  created_at: new Date().toISOString(),
  stops: [
    {
      order: 1,
      type: "PICKUP",
      title: "Hotel Centro",
      time_local: "09:00",
      address: "Calle Falsa 123",
    },
    {
      order: 2,
      type: "DROPOFF",
      title: "Museo",
      time_local: "09:45",
      address: "Av. Principal 456",
    },
  ],
});

console.log("HTML OK, length:", html.length);
console.log(html.slice(0, 300));
