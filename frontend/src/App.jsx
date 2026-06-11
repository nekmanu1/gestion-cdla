import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Espacios from './pages/Espacios';
import Solicitudes from './pages/Solicitudes';
import Reservas from './pages/Reservas';
import Facturas from './pages/Facturas';
import Usuarios from './pages/Usuarios';
import Auditoria from './pages/Auditoria';
import Configuracion from './pages/Configuracion';
import Reportes from './pages/Reportes';
import { Toaster } from 'react-hot-toast';
import Calendario from './pages/Calendario';

function RutaProtegida({ children }) {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" />;
    }

    return children;
}

function Placeholder({ titulo }) {
    return <h1>{titulo}</h1>;
}

function App() {
    return (
        <BrowserRouter>
          <Toaster position="top-right" />
            <Routes>
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/login" element={<Login />} />

                <Route
                    element={
                        <RutaProtegida>
                            <Layout />
                        </RutaProtegida>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/clientes" element={<Clientes />} />
                    <Route path="/espacios" element={<Espacios />} />
                    <Route path="/solicitudes" element={<Solicitudes />} />
                    <Route path="/reservas" element={<Reservas />} />
                    <Route path="/facturas" element={<Facturas />} />
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/reportes" element={<Reportes />} />
                    <Route path="/auditoria" element={<Auditoria />} />
                    <Route path="/configuracion" element={<Configuracion />} />
                    <Route path="/calendario" element={<Calendario />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;