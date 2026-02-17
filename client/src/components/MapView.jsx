import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';

export default function MapView({ zones, deliveries, selectedIds = [], onDeliveryClick, center, zoom, children }) {
    const mapCenter = center || [14.634, -90.507];
    const mapZoom = zoom || 12;

    const zoneStyle = (feature) => ({
        fillColor: feature.properties.color || '#3388ff',
        fillOpacity: 0.15,
        color: feature.properties.color || '#3388ff',
        weight: 2,
        opacity: 0.7,
        dashArray: '4 4',
    });

    const onEachZone = (feature, layer) => {
        layer.bindTooltip(feature.properties.name, {
            permanent: false,
            direction: 'center',
            className: '',
        });
    };

    const getMarkerColor = (delivery) => {
        if (selectedIds.includes(delivery.id)) return '#06b6d4';
        const colors = {
            pending: '#f59e0b',
            assigned: '#3b82f6',
            in_transit: '#8b5cf6',
            delivered: '#22c55e',
            cancelled: '#ef4444',
        };
        return colors[delivery.status] || '#94a3b8';
    };

    return (
        <div className="map-container">
            <MapContainer center={mapCenter} zoom={mapZoom} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {zones && zones.features && (
                    <GeoJSON
                        key={JSON.stringify(zones)}
                        data={zones}
                        style={zoneStyle}
                        onEachFeature={onEachZone}
                    />
                )}

                {deliveries && deliveries.map(d => (
                    <CircleMarker
                        key={d.id}
                        center={[parseFloat(d.lat), parseFloat(d.lng)]}
                        radius={selectedIds.includes(d.id) ? 10 : 7}
                        pathOptions={{
                            fillColor: getMarkerColor(d),
                            fillOpacity: 0.9,
                            color: '#fff',
                            weight: selectedIds.includes(d.id) ? 3 : 1.5,
                            opacity: 0.9,
                        }}
                        eventHandlers={{
                            click: () => onDeliveryClick && onDeliveryClick(d),
                        }}
                    >
                        <Popup>
                            <div>
                                <div className="popup-title">{d.client_name}</div>
                                <div className="popup-detail">
                                    📍 {d.address}<br />
                                    📦 {d.quantity_liters}L — {d.product_type}<br />
                                    🏷️ {d.zone_name || 'Sin zona'}<br />
                                    📋 {d.status}
                                </div>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}

                {children}
            </MapContainer>
        </div>
    );
}
