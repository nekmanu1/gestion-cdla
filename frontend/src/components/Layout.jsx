import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
    FiHome,
    FiUsers,
    FiMapPin,
    FiClipboard,
    FiCalendar,
    FiDollarSign,
    FiUser,
    FiSettings,
    FiFileText,
    FiActivity,
    FiLogOut,
    FiBookmark,
    FiPlusCircle
} from 'react-icons/fi';

import NuevaSolicitudModal from './solicitudes/NuevaSolicitudModal';

export default function Layout() {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const [mostrarNuevaSolicitud, setMostrarNuevaSolicitud] = useState(false);

    const puedeCrearSolicitud =
        usuario?.rol === 'ADMIN' || usuario?.rol === 'OPERADOR';

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    }

    return (
           <div className="h-screen bg-gray-100 flex overflow-hidden">
              <aside className="w-64 bg-neutral-950 text-white hidden md:flex md:flex-col h-screen shrink-0 overflow-hidden">
    <div className="p-5 shrink-0">
        <h2 className="text-2xl font-bold">CDLA</h2>
        <p className="text-xs text-gray-400">Gestión de Espacios</p>
    </div>

    <nav className="flex-1 overflow-y-auto px-5 pb-4 space-y-2">
        <MenuLink to="/dashboard" label="Dashboard" icon={<FiHome />} />
        <MenuLink to="/clientes" label="Clientes" icon={<FiUsers />} />
        <MenuLink to="/espacios" label="Espacios" icon={<FiMapPin />} />
        <MenuLink to="/solicitudes" label="Solicitudes" icon={<FiClipboard />} />
        <MenuLink to="/reservas" label="Reservas" icon={<FiBookmark />} />
        <MenuLink to="/calendario" label="Calendario" icon={<FiCalendar />} />
        <MenuLink to="/facturas" label="Facturación" icon={<FiDollarSign />} />
        <MenuLink to="/reportes" label="Reportes" icon={<FiFileText />} />

        {usuario?.rol === 'ADMIN' && (
            <>
                <MenuLink to="/usuarios" label="Usuarios" icon={<FiUser />} />
                <MenuLink to="/configuracion" label="Configuración" icon={<FiSettings />} />
                <MenuLink to="/auditoria" label="Auditoría" icon={<FiActivity />} />
            </>
        )}
    </nav>

    <div className="p-5 shrink-0 border-t border-white/10">
        <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition w-full"
        >
            <FiLogOut />
            Salir
        </button>
    </div>
</aside>
               <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shrink-0">
                    <div>
                        <p className="font-semibold text-gray-900">
                            {usuario?.nombre}
                        </p>
                        <p className="text-xs text-gray-500">
                            {usuario?.rol}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {puedeCrearSolicitud && (
                            <button
                                type="button"
                                onClick={() => setMostrarNuevaSolicitud(true)}
                                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-950 text-white text-sm font-medium hover:bg-neutral-800 transition"
                            >
                                <FiPlusCircle />
                                Nueva solicitud
                            </button>
                        )}

                        <button
                            onClick={logout}
                            className="md:hidden bg-neutral-950 text-white px-4 py-2 rounded-lg text-sm"
                        >
                            Salir
                        </button>
                    </div>
                </header>

              
            <section className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </section>
            </main>

            {mostrarNuevaSolicitud && (
                <NuevaSolicitudModal
                    onClose={() => setMostrarNuevaSolicitud(false)}
                />
            )}
        </div>
    );
}

function MenuLink({ to, label, icon }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition"
        >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}