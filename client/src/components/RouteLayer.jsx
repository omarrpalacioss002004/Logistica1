import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function RouteLayer({ geometry }) {
    const map = useMap();

    useEffect(() => {
        if (!geometry || !geometry.coordinates) return;

        const routeLine = L.geoJSON(geometry, {
            style: {
                color: '#06b6d4',
                weight: 4,
                opacity: 0.8,
                dashArray: '8 6',
                lineCap: 'round',
                lineJoin: 'round',
            },
        });

        routeLine.addTo(map);

        // Fit map bounds to the route
        const bounds = routeLine.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [40, 40] });
        }

        return () => {
            map.removeLayer(routeLine);
        };
    }, [geometry, map]);

    return null;
}
