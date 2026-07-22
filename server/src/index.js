// src/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const routes = require('./routes');
const { errorHandler, notFound } = require('./middlewares/error.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security & Logging ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── CORS ──────────────────────────────────────────────────────────────────────
const configuredOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      // Allow configured origins, any localhost/127.0.0.1 port, or Vercel deployments
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      const isVercel = /^https:\/\/.*\.vercel\.app$/.test(origin);
      if (configuredOrigins.includes(origin) || isLocalhost || isVercel || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // relaxed in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 20 : 10000, // relaxed in development
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' },
});

app.use(generalLimiter);

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Static Uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// Serve client built files if they exist
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
}

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Pharmora API' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter); // stricter rate limit on auth
app.use('/api', routes);

// Fallback to client index.html for SPA routing
app.get('/*splat', (req, res, next) => {
  if (
    !req.path.startsWith('/api') &&
    !req.path.startsWith('/uploads') &&
    fs.existsSync(path.join(clientDistPath, 'index.html'))
  ) {
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  }
  next();
});

// ── 404 & Error Handlers ──────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const { initRecurringJob } = require('./jobs/recurring.job');

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Pharmora API running on http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
  
  // Start the recurring transactions background scheduler
  initRecurringJob();
});

module.exports = app;
