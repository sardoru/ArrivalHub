import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { initializeScheduler } from './jobs/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Memphis Events Dashboard API',
    version: '1.0.0',
    endpoints: {
      events: '/api/events',
      calendar: '/api/events/calendar',
      pricing: '/api/pricing/daily',
      sync: '/api/sync/status',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Memphis Events API server running on port ${PORT}`);

  // Initialize scheduled jobs (only in production or when explicitly enabled)
  if (process.env.ENABLE_SCHEDULER === 'true' || process.env.NODE_ENV === 'production') {
    initializeScheduler();
  } else {
    console.log('Scheduler disabled in development. Set ENABLE_SCHEDULER=true to enable.');
  }
});

export default app;
