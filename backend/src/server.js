const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const espacioRoutes = require('./routes/espacioRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const facturaRoutes = require('./routes/facturaRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const configuracionRoutes = require('./routes/configuracionRoutes');
const reporteRoutes = require('./routes/reporteRoutes');


const app = express();

app.use(cors());
app.use(express.json());
app.use(
    '/uploads',
    express.static('uploads')
);

app.get('/', (req, res) => {
    res.json({
        message: 'API CDLA Gestión funcionando correctamente'
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/espacios', espacioRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/auditorias', auditoriaRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/reportes', reporteRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});