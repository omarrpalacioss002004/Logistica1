import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { Bell } from 'lucide-react';

const pageTitles = {
    '/': 'Dashboard',
    '/fleet': 'Gestión de Flotilla',
    '/maintenance': 'Mantenimiento',
    '/checklists': 'Checklists Diarios',
    '/assignments': 'Asignación de Rutas',
};

export default function Layout() {
    const location = useLocation();
    const { user } = useAuth();
    const title = pageTitles[location.pathname] || 'LogístiCA';

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="app-content">
                <header className="app-header">
                    <h1>{title}</h1>
                    <div className="user-info">
                        <button className="btn-icon"><Bell size={18} /></button>
                        <span>{user?.first_name} {user?.last_name}</span>
                        <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 700, color: 'white'
                        }}>
                            {user?.first_name?.[0]}{user?.last_name?.[0]}
                        </div>
                    </div>
                </header>
                <main className="app-main">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
