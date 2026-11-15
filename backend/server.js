// ==========================================
// TraceNG Backend — server.js
// Node.js + Express + MongoDB
// Deployed on Render, frontend on Netlify/Vercel
// ==========================================

// 1) Load env vars FIRST — before anything reads process.env
require('dotenv').config();

// 2) Optional DNS override (helps on some restricted hosts / ISPs)
//    Safe to keep; remove if you don't need it.
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Journey = require('./models/journey.js');
const User = require('./models/user.js');

const app = express();

// ==========================================
// CORE MIDDLEWARE
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// ENV VALIDATION — fail fast if misconfigured
// ==========================================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGO_URI) {
  console.error('❌ FATAL: MONGO_URI is not set. Add it in Render → Environment.');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set. Add it in Render → Environment.');
  process.exit(1);
}

// ==========================================
// CORS — restrict to your known frontends
// ==========================================
const allowedOrigins = [
  'http://localhost:5000',      // local dev (served by this same server)
  'http://localhost:5500',      // VS Code Live Server
  'http://127.0.0.1:5500',
  'https://traceng.vercel.app', // update to your real Vercel/Netlify URL after deploy
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (curl, Postman, same-origin)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// ==========================================
// HEALTH CHECK (useful for Render uptime + wakeups)
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TraceNG API',
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ==========================================
// AUTH ENDPOINTS
// ==========================================

// --- SIGN UP ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, course, level } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({ name, email, passwordHash, course, level });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, course: newUser.course },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        course: newUser.course,
        level: newUser.level,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// --- LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, course: user.course },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        course: user.course,
        level: user.level,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ==========================================
// JOURNEY ENDPOINTS
// ==========================================

// CREATE journey
app.post('/api/journeys', async (req, res) => {
  try {
    const newJourney = new Journey(req.body);
    await newJourney.save();
    res.status(201).json({ success: true, message: 'Journey saved to database!' });
  } catch (error) {
    console.error('Journey save error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// LIST all journeys
app.get('/api/journeys', async (req, res) => {
  try {
    const journeys = await Journey.find().sort({ createdAt: -1 });
    res.json(journeys);
  } catch (error) {
    console.error('Journey fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// STATIC FRONTEND (optional — only if frontend/ exists in repo)
// On Render, if you deploy frontend separately (Netlify/Vercel),
// this block simply no-ops. Safe either way.
// ==========================================
const parentFrontend = path.join(__dirname, '..', 'frontend');
const localFrontend = path.join(__dirname, 'frontend');
const frontendPath = fs.existsSync(parentFrontend)
  ? parentFrontend
  : fs.existsSync(localFrontend)
  ? localFrontend
  : null;

if (frontendPath) {
  console.log(`📁 Serving static frontend from: ${frontendPath}`);
  app.use(express.static(frontendPath));

  // SPA fallback for non-API GET routes
  app.get(/^\/(?!api).*/, (req, res, next) => {
    const indexPath = path.join(frontendPath, 'index.html');
    if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
    next();
  });
} else {
  console.log('ℹ️  No local frontend/ folder — skipping static serving.');
}

// Root route for API-only deployments
app.get('/', (req, res) => {
  res.json({
    service: 'TraceNG API',
    status: 'running',
    docs: {
      health: '/api/health',
      signup: 'POST /api/auth/signup',
      login: 'POST /api/auth/login',
      journeys: 'GET/POST /api/journeys',
    },
  });
});

// 404 for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
});

// ==========================================
// DATABASE CONNECTION & SERVER START
// ==========================================
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected Successfully to Atlas 🚀');
    app.listen(PORT, () => {
      console.log(`🚀 Server live on port ${PORT}`);
      console.log(`🌍 Allowed CORS origins: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    // Don't start the server if DB is unreachable — Render will retry on next deploy
    process.exit(1);
  });