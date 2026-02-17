import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Truck, Wrench, ClipboardCheck,
    MapPin, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/assignments', icon: MapPin, label: 'Asignaciones' },
];

const moduleItems = [
    { to: '/fleet', icon: Truck, label: 'Flotilla' },
    { to: '/maintenance', icon: Wrench, label: 'Mantenimiento' },
    { to: '/checklists', icon: ClipboardCheck, label: 'Checklists' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <div className="logo-icon">L</div>
                <div>
                    <div className="logo-text">LogístiCA</div>
                    <div className="logo-sub">Lubricantes</div>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="sidebar-section">Principal</div>
                {navItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/'}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                <div className="sidebar-section">Módulos</div>
                {moduleItems.map(item => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ padding: '8px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    {user?.first_name} {user?.last_name}
                </div>
                <button className="nav-item" onClick={logout} style={{ width: '100%', background: 'none' }}>
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
}
