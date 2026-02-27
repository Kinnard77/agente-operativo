'use client';
import React from 'react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ItinerarioSalida, DESTINO_FIJO } from '../../blueprint';

// Fix moved to useEffect

interface MapComponentProps {
    trips: (ItinerarioSalida & { coords: { lat: number; lng: number } })[];
}

const MapComponent = ({ trips }: MapComponentProps) => {
    // Default center (CDMX)
    const defaultCenter: [number, number] = [19.4326, -99.1332];

    React.useEffect(() => {
        // Fix for default marker icon in Leaflet with Next.js
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
    }, []);

    return (
        <MapContainer center={defaultCenter} zoom={6} scrollWheelZoom={false} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {trips.map((trip) => (
                <Marker key={trip.id_salida} position={[trip.coords.lat, trip.coords.lng]}>
                    <Popup>
                        <strong>{trip.ciudad_origen}</strong><br />
                        {trip.fecha_salida}<br />
                        {DESTINO_FIJO}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
