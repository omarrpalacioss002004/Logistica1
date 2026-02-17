import { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, X, AlertTriangle, Wrench, Search } from 'lucide-react';

export default function Maintenance() {
    const [logs, setLogs] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        vehicle_id: '', type: 'preventive', description: '', cost: '',
        service_provider: '', service_date: '', next_due_date: '',
        odometer_at_service: '', parts_replaced: ''
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const [logsRes, alertsRes, vehiclesRes] = await Promise.all([
                api.get('/maintenance'),
                api.get('/maintenance/alerts'),
                api.get('/vehicles'),
            ]);
            setLogs(logsRes.data);
            setAlerts(alertsRes.data);
            setVehicles(vehiclesRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/maintenance', form);
            setShowModal(false);
            loadData();
        } catch (err) {
            alert(err.response?.data?.error || 'Error');
        }
    };

    if (loading) return <div className="empty-state loading"><p>Cargando mantenimiento...</p></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Mantenimiento</h2>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <Plus size={18} /> Nuevo Registro
                </button>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div className="card" style={{ marginBottom: 24, borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                    <div className="card-header">
                        <h3 className="card-title" style={{ color: 'var(--accent-red)' }}>
                            <AlertTriangle size={18} style={{ display: 'inline', marginRight: 8 }} />
                            Alertas de Mantenimiento ({alerts.length})
                        </h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {alerts.map(a => (
                            <div key={a.id} style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                padding: '10px 14px', borderRadius: 8,
                                background: a.alert_level === 'overdue' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
                                border: `1px solid ${a.alert_level === 'overdue' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            }}>
                                <span className={`badge badge-${a.alert_level}`}>{a.alert_level === 'overdue' ? 'Vencido' : 'Próximo'}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.plate}</span>
                                <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.description}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    {a.next_due_date ? new Date(a.next_due_date).toLocaleDateString() : '—'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* History Table */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title"><Wrench size={18} style={{ display: 'inline', marginRight: 8 }} /> Historial</h3>
                </div>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Vehículo</th>
                                <th>Tipo</th>
                                <th>Descripción</th>
                                <th>Proveedor</th>
                                <th>Costo</th>
                                <th>Próximo</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(l => (
                                <tr key={l.id}>
                                    <td>{new Date(l.service_date).toLocaleDateString()}</td>
                                    <td style={{ fontWeight: 600 }}>{l.vehicle_plate}</td>
                                    <td><span className={`badge badge-${l.type === 'corrective' ? 'overdue' : 'ok'}`}>{l.type}</span></td>
                                    <td>{l.description}</td>
                                    <td>{l.service_provider || '—'}</td>
                                    <td style={{ fontWeight: 600 }}>Q{Number(l.cost).toLocaleString()}</td>
                                    <td>{l.next_due_date ? new Date(l.next_due_date).toLocaleDateString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Nuevo Registro de Mantenimiento</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Vehículo</label>
                                    <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                                        <option value="">Seleccionar...</option>
                                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Tipo</label>
                                    <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                        <option value="preventive">Preventivo</option>
                                        <option value="corrective">Correctivo</option>
                                        <option value="inspection">Inspección</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Costo (Q)</label>
                                    <input className="form-input" type="number" step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Proveedor</label>
                                    <input className="form-input" value={form.service_provider} onChange={e => setForm({ ...form, service_provider: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Fecha Servicio</label>
                                    <input className="form-input" type="date" value={form.service_date} onChange={e => setForm({ ...form, service_date: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Próximo Servicio</label>
                                    <input className="form-input" type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Partes Reemplazadas</label>
                                <input className="form-input" value={form.parts_replaced} onChange={e => setForm({ ...form, parts_replaced: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Registrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
