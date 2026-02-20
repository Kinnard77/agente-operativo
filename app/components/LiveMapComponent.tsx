import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon
const icon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to fly to new coords
function MapUpdater({ coords }: { coords: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(coords, 13);
    }, [coords, map]);
    return null;
}

export default function LiveMapComponent({ lat, lng }: { lat: number, lng: number }) {
    const position: [number, number] = [lat, lng];

    return (
        <MapContainer center={position} zoom={13} style={{ height: '300px', width: '100%', borderRadius: '8px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position} icon={icon} />
            <MapUpdater coords={position} />
        </MapContainer>
    )
}
