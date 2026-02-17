import { useState, useEffect } from 'react';
import api from '../api/client';
import MapView from '../components/MapView';
import { Package, Truck, MapPin, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
    const [zones, setZones] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [zoneStats, setZoneStats] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [zonesRes, deliveriesRes, statsRes] = await Promise.all([
                api.get('/zones'),
                api.get('/deliveries'),
                api.get('/zones/stats'),
            ]);
            setZones(zonesRes.data);
            setDeliveries(deliveriesRes.data);
            setZoneStats(statsRes.data);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const totalPending = deliveries.filter(d => d.status === 'pending').length;
    const totalAssigned = deliveries.filter(d => d.status === 'assigned').length;
    const totalInTransit = deliveries.filter(d => d.status === 'in_transit').length;
    const totalDelivered = deliveries.filter(d => d.status === 'delivered').length;

    if (loading) {
        return <div className="empty-state loading"><p>Cargando dashboard...</p></div>;
    }

    return (
        <div>
            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon orange"><Clock size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{totalPending}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon blue"><Package size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{totalAssigned}</div>
                        <div className="stat-label">Asignadas</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon purple"><Truck size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{totalInTransit}</div>
                        <div className="stat-label">En Tránsito</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon green"><CheckCircle size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{totalDelivered}</div>
                        <div className="stat-label">Entregadas</div>
                    </div>
                </div>
            </div>

            {/* Map + Side Panel */}
            <div className="dashboard-grid">
                <div className="dashboard-map">
                    <MapView zones={zones} deliveries={deliveries} />
                </div>

                <div className="dashboard-panel">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">📊 Entregas por Zona</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {zoneStats.map(z => (
                                <div key={z.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '8px 12px', borderRadius: 8,
                                    background: 'var(--bg-tertiary)',
                                    border: '1px solid var(--border-subtle)'
                                }}>
                                    <div style={{
                                        width: 12, height: 12, borderRadius: 3,
                                        background: z.color, flexShrink: 0
                                    }} />
                                    <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>{z.name}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        {z.pending} pend — {z.delivered} ent
                                    </span>
                                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-accent)' }}>
                                        {z.total}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">📦 Entregas Recientes</h3>
                        </div>
                        <div className="delivery-list">
                            {deliveries.slice(0, 8).map(d => (
                                <div key={d.id} className="delivery-item">
                                    <div className="delivery-dot" style={{ background: d.zone_color || '#94a3b8' }} />
                                    <div className="delivery-info">
                                        <div className="delivery-client">{d.client_name}</div>
                                        <div className="delivery-address">{d.address}</div>
                                    </div>
                                    <span className={`badge badge-${d.status}`}>{d.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
