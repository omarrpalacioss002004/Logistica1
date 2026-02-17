import { useState, useEffect } from 'react';
import api from '../api/client';
import { CheckCircle, XCircle, ClipboardCheck, Calendar } from 'lucide-react';

export default function Checklists() {
    const [checklists, setChecklists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => { loadChecklists(); }, [dateFilter]);

    const loadChecklists = async () => {
        try {
            const { data } = await api.get('/checklists', { params: { date: dateFilter } });
            setChecklists(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const checkItems = [
        { key: 'tires_ok', label: 'Neumáticos' },
        { key: 'oil_ok', label: 'Aceite' },
        { key: 'brakes_ok', label: 'Frenos' },
        { key: 'lights_ok', label: 'Luces' },
        { key: 'mirrors_ok', label: 'Espejos' },
        { key: 'horn_ok', label: 'Bocina' },
        { key: 'seatbelt_ok', label: 'Cinturón' },
        { key: 'fire_extinguisher_ok', label: 'Extintor' },
    ];

    if (loading) return <div className="empty-state loading"><p>Cargando checklists...</p></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Checklists Diarios</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Calendar size={18} style={{ color: 'var(--text-muted)' }} />
                    <input
                        type="date"
                        className="form-input"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        style={{ width: 'auto' }}
                    />
                </div>
            </div>

            {checklists.length === 0 ? (
                <div className="empty-state">
                    <ClipboardCheck size={48} />
                    <p>No hay checklists para esta fecha</p>
                </div>
            ) : (
                <div className="checklist-grid">
                    {checklists.map(c => {
                        const passCount = checkItems.filter(ci => c[ci.key]).length;
                        const totalChecks = checkItems.length;
                        const allPass = passCount === totalChecks;

                        return (
                            <div key={c.id} className="checklist-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.vehicle_plate}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Conductor: {c.driver_name}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '6px 14px', borderRadius: 100,
                                        background: allPass ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                                        color: allPass ? 'var(--accent-green)' : 'var(--accent-orange)',
                                        fontSize: '0.75rem', fontWeight: 700,
                                    }}>
                                        {passCount}/{totalChecks}
                                    </div>
                                </div>

                                <div className="checklist-checks">
                                    {checkItems.map(ci => (
                                        <div key={ci.key} className={`check-item ${c[ci.key] ? 'pass' : 'fail'}`}>
                                            {c[ci.key] ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            <span>{ci.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ marginTop: 12, display: 'flex', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span>⛽ {c.fuel_level || '—'}</span>
                                    <span>📏 {c.odometer_reading ? `${Number(c.odometer_reading).toLocaleString()} km` : '—'}</span>
                                    <span>Estado: <strong style={{ color: c.general_condition === 'good' ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{c.general_condition}</strong></span>
                                </div>

                                {c.notes && (
                                    <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        📝 {c.notes}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
