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
    FiPlusCircle,
    FiMenu,
    FiX
} from 'react-icons/fi';

import logoCdla from '../assets/logos/cdla.png';
import NuevaSolicitudModal from './solicitudes/NuevaSolicitudModal';

export default function Layout() {
    const navigate = useNavigate();
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    const [menuMovil, setMenuMovil] = useState(false);
    const [mostrarNuevaSolicitud, setMostrarNuevaSolicitud] = useState(false);

    const puedeCrearSolicitud =
        usuario?.rol === 'ADMIN' || usuario?.rol === 'OPERADOR';

    function logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/login');
    }

    const menuItems = [
        { to: '/dashboard', label: 'Dashboard', icon: <FiHome /> },
        { to: '/clientes', label: 'Clientes', icon: <FiUsers /> },
        { to: '/espacios', label: 'Espacios', icon: <FiMapPin /> },
        { to: '/solicitudes', label: 'Solicitudes', icon: <FiClipboard /> },
        { to: '/reservas', label: 'Reservas', icon: <FiBookmark /> },
        { to: '/calendario', label: 'Calendario', icon: <FiCalendar /> },
        { to: '/facturas', label: 'Facturación', icon: <FiDollarSign /> },
        { to: '/reportes', label: 'Reportes', icon: <FiFileText /> }
    ];

    const adminItems = [
        { to: '/usuarios', label: 'Usuarios', icon: <FiUser /> },
        { to: '/configuracion', label: 'Ajustes', icon: <FiSettings /> },
        { to: '/auditoria', label: 'Auditoría', icon: <FiActivity /> }
    ];

    return (
        <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
                <div className="h-20 px-4 md:px-6 flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center">
                        <img
                            src={logoCdla}
                            alt="Ciudad de las Artes"
                            className="h-12 md:h-14 w-auto object-contain"
                        />
                    </Link>

                    <div className="flex items-center gap-3">
                        {puedeCrearSolicitud && (
                            <button
                                type="button"
                                onClick={() => setMostrarNuevaSolicitud(true)}
                                className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-neutral-950 text-white text-sm font-medium hover:bg-neutral-800 transition"
                            >
                                <FiPlusCircle />
                                <span className="hidden sm:inline">
                                    Nueva solicitud
                                </span>
                            </button>
                        )}

                        <div className="hidden md:flex items-center gap-3 border-l border-gray-200 pl-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                                <FiUser />
                            </div>

                            <div className="leading-tight">
                                <p className="text-sm font-semibold text-gray-900">
                                    {usuario?.nombre}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {usuario?.rol}
                                </p>
                            </div>
                        </div>


                        <button
                            onClick={() => setMenuMovil(true)}
                            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        >
                            <FiMenu className="text-xl" />
                        </button>
                    </div>
                </div>

                <nav className="hidden lg:flex h-14 border-t border-gray-200 bg-gray-50 items-center px-6 gap-1 overflow-x-auto">
                    {menuItems.map((item) => (
                        <TopLink
                            key={item.to}
                            to={item.to}
                            label={item.label}
                            icon={item.icon}
                        />
                    ))}

                    {usuario?.rol === 'ADMIN' && (
                        <>
                            {adminItems.map((item) => (
                                <TopLink
                                    key={item.to}
                                    to={item.to}
                                    label={item.label}
                                    icon={item.icon}
                                />
                            ))}
                        </>
                    )}
                    <button
                            onClick={logout}
                            className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                            <FiLogOut />
                            Salir
                        </button>
                </nav>
            </header>

            {menuMovil && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setMenuMovil(false)}
                    />

                    <aside className="relative ml-auto w-80 max-w-[88%] h-full bg-white shadow-xl flex flex-col">
                        <div className="h-20 px-5 border-b border-gray-200 flex items-center justify-between">
                            <img
                                src={logoCdla}
                                alt="Ciudad de las Artes"
                                className="h-12 w-auto object-contain"
                            />

                            <button
                                onClick={() => setMenuMovil(false)}
                                className="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 text-gray-700"
                            >
                                <FiX className="text-xl" />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600">
                                <FiUser />
                            </div>

                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {usuario?.nombre}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {usuario?.rol}
                                </p>
                            </div>
                        </div>

                        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                            {menuItems.map((item) => (
                                <MobileLink
                                    key={item.to}
                                    to={item.to}
                                    label={item.label}
                                    icon={item.icon}
                                    onClick={() => setMenuMovil(false)}
                                />
                            ))}

                            {usuario?.rol === 'ADMIN' && (
                                <>
                                    <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase">
                                        Administración
                                    </div>

                                    {adminItems.map((item) => (
                                        <MobileLink
                                            key={item.to}
                                            to={item.to}
                                            label={item.label}
                                            icon={item.icon}
                                            onClick={() => setMenuMovil(false)}
                                        />
                                    ))}
                                </>
                            )}
                        </nav>

                        <div className="p-4 border-t border-gray-200 space-y-3">
                            {puedeCrearSolicitud && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuMovil(false);
                                        setMostrarNuevaSolicitud(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-neutral-950 text-white text-sm font-medium"
                                >
                                    <FiPlusCircle />
                                    Nueva solicitud
                                </button>
                            )}

                            <button
                                onClick={logout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-gray-700 text-sm"
                            >
                                <FiLogOut />
                                Salir
                            </button>
                        </div>
                    </aside>
                </div>
            )}

            <main className="flex-1 overflow-y-auto p-4 md:p-6">
                <Outlet />
            </main>

            {mostrarNuevaSolicitud && (
                <NuevaSolicitudModal
                    onClose={() => setMostrarNuevaSolicitud(false)}
                />
            )}
        </div>
    );
}

function TopLink({ to, label, icon }) {
    return (
        <Link
            to={to}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-white hover:text-gray-900 transition whitespace-nowrap"
        >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

function MobileLink({ to, label, icon, onClick }) {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition"
        >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}