const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const messRoutes = require('./routes/messRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const vendorRoutes = require('./routes/vendorRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startClosingAlertsCron } = require('./jobs/closingAlerts');

// Load environment variables
dotenv.config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messes', messRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/notifications', notificationRoutes);

// Start background cron jobs in non-test mode
if (process.env.NODE_ENV !== 'test') {
  startClosingAlertsCron();
}

// Health Check Endpoint (Phase 1)
app.get('/api/health', (req, res) => {
  const mongoStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.status(200).json({
    status: 'ok',
    message: 'Centralized Mess System API is operational',
    timestamp: new Date().toISOString(),
    database: mongoStatusMap[mongoose.connection.readyState] || 'unknown',
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Root route
app.get('/', (req, res) => {
  res.send({ message: 'Welcome to Centralized Mess System API. Use /api/health to inspect status.' });
});

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found', path: req.originalUrl });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`[Server] Centralized Mess System backend running on port ${PORT}`);
  });
}

module.exports = app;
