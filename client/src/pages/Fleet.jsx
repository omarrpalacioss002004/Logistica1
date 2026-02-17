import { useState, useEffect } from 'react';
import api from '../api/client';
import { Plus, Truck, X, Fuel, Gauge } from 'lucide-react';

export default function Fleet() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editVehicle, setEditVehicle] = useState(null);
    const [form, setForm] = useState({
        plate: '', brand: '', model: '', year: '', color: '',
        capacity_liters: '', fuel_type: 'diesel', odometer_km: '', status: 'active', notes: ''
    });

    useEffect(() => { loadVehicles(); }, []);

    const loadVehicles = async () => {
        try {
            const { data } = await api.get('/vehicles');
            setVehicles(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (vehicle = null) => {
        if (vehicle) {
            setEditVehicle(vehicle);
            setForm({
                plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model,
                year: vehicle.year, color: vehicle.color || '',
                capacity_liters: vehicle.capacity_liters || '', fuel_type: vehicle.fuel_type || 'diesel',
                odometer_km: vehicle.odometer_km || '', status: vehicle.status,
                notes: vehicle.notes || ''
            });
        } else {
            setEditVehicle(null);
            setForm({ plate: '', brand: '', model: '', year: '', color: '', capacity_liters: '', fuel_type: 'diesel', odometer_km: '', status: 'active', notes: '' });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editVehicle) {
                await api.put(`/vehicles/${editVehicle.id}`, form);
            } else {
                await api.post('/vehicles', form);
            }
            setShowModal(false);
            loadVehicles();
        } catch (err) {
            alert(err.response?.data?.error || 'Error');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este vehículo?')) return;
        try {
            await api.delete(`/vehicles/${id}`);
            loadVehicles();
        } catch (err) {
            alert(err.response?.data?.error || 'Error');
        }
    };

    if (loading) return <div className="empty-state loading"><p>Cargando flotilla...</p></div>;

    return (
        <div>
            <div className="page-header">
                <h2>Flotilla de Vehículos</h2>
                <button className="btn btn-primary" onClick={() => openModal()}>
                    <Plus size={18} /> Agregar Vehículo
                </button>
            </div>

            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon green"><Truck size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{vehicles.filter(v => v.status === 'active').length}</div>
                        <div className="stat-label">Activos</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon orange"><Gauge size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{vehicles.filter(v => v.status === 'maintenance').length}</div>
                        <div className="stat-label">En Mantenimiento</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon cyan"><Fuel size={24} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{vehicles.length}</div>
                        <div className="stat-label">Total Flota</div>
                    </div>
                </div>
            </div>

            <div className="vehicle-grid">
                {vehicles.map(v => (
                    <div key={v.id} className="vehicle-card" onClick={() => openModal(v)}>
                        <div className="vehicle-card-header">
                            <span className="vehicle-plate">{v.plate}</span>
                            <span className={`badge badge-${v.status}`}>{v.status}</span>
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 12 }}>
                            {v.brand} {v.model} ({v.year})
                        </div>
                        <div className="vehicle-info">
                            <div className="vehicle-info-item">
                                <span className="vehicle-info-label">Capacidad</span>
                                <span className="vehicle-info-value">{v.capacity_liters} L</span>
                            </div>
                            <div className="vehicle-info-item">
                                <span className="vehicle-info-label">Odómetro</span>
                                <span className="vehicle-info-value">{Number(v.odometer_km).toLocaleString()} km</span>
                            </div>
                            <div className="vehicle-info-item">
                                <span className="vehicle-info-label">Combustible</span>
                                <span className="vehicle-info-value">{v.fuel_type}</span>
                            </div>
                            <div className="vehicle-info-item">
                                <span className="vehicle-info-label">Color</span>
                                <span className="vehicle-info-value">{v.color || '—'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
                            <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Placa</label>
                                    <input className="form-input" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Año</label>
                                    <input className="form-input" type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Marca</label>
                                    <input className="form-input" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Modelo</label>
                                    <input className="form-input" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} required />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Capacidad (Litros)</label>
                                    <input className="form-input" type="number" value={form.capacity_liters} onChange={e => setForm({ ...form, capacity_liters: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Odómetro (km)</label>
                                    <input className="form-input" type="number" value={form.odometer_km} onChange={e => setForm({ ...form, odometer_km: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Color</label>
                                    <input className="form-input" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Estado</label>
                                    <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                        <option value="active">Activo</option>
                                        <option value="maintenance">Mantenimiento</option>
                                        <option value="inactive">Inactivo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Notas</label>
                                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                            </div>
                            <div className="modal-actions">
                                {editVehicle && (
                                    <button type="button" className="btn btn-danger" onClick={() => { handleDelete(editVehicle.id); setShowModal(false); }}>
                                        Eliminar
                                    </button>
                                )}
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">{editVehicle ? 'Guardar' : 'Crear'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
