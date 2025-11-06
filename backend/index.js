require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const path = require('path');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5177', 
    'http://localhost:5173', 
    /^http:\/\/localhost:\d+$/,
    'https://attendancemanagementbackend.onrender.com',
    /^https:\/\/.*\.onrender\.com$/
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler - must be last
app.use((err, req, res, next) => {
  console.error('🔥 Unhandled Server Error:', err);
  console.error('Error Stack:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/Attendancemsd';
mongoose.connect(MONGO)
  .then(()=> {
    console.log('✅ Mongo connected successfully');
    const DEFAULT_PORT = parseInt(process.env.PORT,10) || 5000;

    // Helper to attempt to start server on a port and on EADDRINUSE try next port up to +10
    const startServer = (port, attemptsLeft=10) => {
      const server = app.listen(port, ()=> {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📡 API endpoints available at http://localhost:${port}/api`);
      });
      server.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          console.error(`Port ${port} is already in use.`);
          if (attemptsLeft > 0) {
            const nextPort = port + 1;
            console.log(`Trying next port ${nextPort} (${attemptsLeft-1} attempts left)...`);
            // Delay briefly then try next port
            setTimeout(() => startServer(nextPort, attemptsLeft-1), 500);
            return;
          } else {
            console.error('No free port found after multiple attempts. Free it or set PORT env to a free port.');
            console.error('On Windows PowerShell:');
            console.error('  netstat -ano | findstr :%PORT%');
            console.error('  taskkill /PID <pid> /F');
            process.exit(1);
          }
        } else {
          throw err;
        }
      });
    };

    startServer(DEFAULT_PORT);
  })
  .catch(err => {
    console.error('❌ Mongo connection error:', err.message);
    console.error('💡 Check your MONGO_URI in .env file');
    console.error('💡 Make sure MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for all)');
    process.exit(1);
  });
