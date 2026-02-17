require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const deliveryRoutes = require('./routes/deliveries');
const checklistRoutes = require('./routes/checklists');
const maintenanceRoutes = require('./routes/maintenance');
const zoneRoutes = require('./routes/zones');
const routingRoutes = require('./routes/routing');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/routing', routingRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Logistica API running on port ${PORT}`);
});
