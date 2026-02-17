import { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import RouteLayer from '../components/RouteLayer';
import { Send, Route, Check, User, Truck } from 'lucide-react';

export default function Assignments() {
    const [deliveries, setDeliveries] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [zones, setZones] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedDriver, setSelectedDriver] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState('');
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [delRes, usrRes, vehRes, zoneRes] = await Promise.all([
                api.get('/deliveries', { params: { status: 'pending' } }),
                api.get('/users', { params: { role: 'driver' } }),
                api.get('/vehicles', { params: { status: 'active' } }),
                api.get('/zones'),
            ]);
            setDeliveries(delRes.data);
            setDrivers(usrRes.data);
            setVehicles(vehRes.data);
            setZones(zoneRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
        setRouteGeometry(null);
        setRouteInfo(null);
    };

    const handleOptimize = async () => {
        if (selectedIds.length < 2) {
            alert('Selecciona al menos 2 entregas para optimizar ruta');
            return;
        }
        try {
            const { data } = await api.post('/routing/optimize', { delivery_ids: selectedIds });
            setRouteGeometry(data.geometry);
            setRouteInfo(data);
        } catch (err) {
            alert('Error al calcular ruta: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleAssign = async () => {
        if (!selectedDriver || !selectedVehicle || selectedIds.length === 0) {
            alert('Selecciona conductor, vehículo y al menos una entrega');
            return;
        }
        try {
            await api.post('/deliveries/assign', {
                delivery_ids: selectedIds,
                driver_id: parseInt(selectedDriver),
                vehicle_id: parseInt(selectedVehicle),
            });
            setSelectedIds([]);
            setRouteGeometry(null);
            setRouteInfo(null);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error');
        }
    };

    if (loading) return <div className="empty-state loading"><p>Cargando asignaciones...</p></div>;

    const selectedDeliveries = deliveries.filter(d => selectedIds.includes(d.id));

    return (
        <div>
            <div className="page-header">
                <h2>Asignación de Rutas</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn btn-secondary" onClick={handleOptimize} disabled={selectedIds.length < 2}>
                        <Route size={18} /> Optimizar Ruta
                    </button>
                    <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedDriver || !selectedVehicle || selectedIds.length === 0}>
                        <Send size={18} /> Asignar
                    </button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Map */}
                <div className="dashboard-map">
                    <MapView
                        zones={zones}
                        deliveries={deliveries}
                        selectedIds={selectedIds}
                        onDeliveryClick={(d) => toggleSelection(d.id)}
                    >
                        {routeGeometry && <RouteLayer geometry={routeGeometry} />}
                    </MapView>
                </div>

                {/* Assignment Panel */}
                <div className="dashboard-panel">
                    {/* Driver + Vehicle Selection */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Asignar Conductor y Vehículo</h3>
                        </div>
                        <div className="form-group">
                            <label className="form-label"><User size={14} style={{ display: 'inline', marginRight: 4 }} /> Conductor</label>
                            <select className="form-select" value={selectedDriver} onChange={e => setSelectedDriver(e.target.value)}>
                                <option value="">Seleccionar conductor...</option>
                                {drivers.map(d => (
                                    <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label"><Truck size={14} style={{ display: 'inline', marginRight: 4 }} /> Vehículo</label>
                            <select className="form-select" value={selectedVehicle} onChange={e => setSelectedVehicle(e.target.value)}>
                                <option value="">Seleccionar vehículo...</option>
                                {vehicles.map(v => (
                                    <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Route Info */}
                    {routeInfo && (
                        <div className="card" style={{ borderColor: 'rgba(6,182,212,0.3)' }}>
                            <div className="card-header">
                                <h3 className="card-title" style={{ color: 'var(--accent-cyan)' }}>
                                    <Route size={18} style={{ display: 'inline', marginRight: 8 }} /> Ruta Optimizada
                                </h3>
                            </div>
                            <div style={{ display: 'flex', gap: 24, fontSize: '0.9rem' }}>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-cyan)' }}>{routeInfo.total_distance_km} km</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distancia total</div>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent-teal)' }}>{routeInfo.total_duration_min} min</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tiempo estimado</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Selection */}
                    <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div className="card-header">
                            <h3 className="card-title">
                                Entregas Pendientes ({deliveries.length})
                            </h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                                {selectedIds.length} seleccionadas
                            </span>
                        </div>
                        <div className="delivery-list" style={{ flex: 1, overflowY: 'auto' }}>
                            {deliveries.map(d => (
                                <div
                                    key={d.id}
                                    className={`delivery-item ${selectedIds.includes(d.id) ? 'selected' : ''}`}
                                    onClick={() => toggleSelection(d.id)}
                                >
                                    <div className="delivery-dot" style={{ background: d.zone_color || '#94a3b8' }} />
                                    <div className="delivery-info">
                                        <div className="delivery-client">{d.client_name}</div>
                                        <div className="delivery-address">{d.address} • {d.quantity_liters}L</div>
                                    </div>
                                    {selectedIds.includes(d.id) && <Check size={18} style={{ color: 'var(--accent-cyan)' }} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
