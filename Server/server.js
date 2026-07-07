import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './models/schema.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://task-mgt-blond.vercel.app'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API', version: '1.0.0', status: 'running' });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// API Routing
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ error: 'Internal server error occurred' });
});

// ─── Local Development ────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await initializeDatabase();
      console.log('All database tables verified/created successfully.');

      const server = app.listen(PORT, () => {
        console.log(`Server successfully started on port ${PORT}`);
      });

      const shutdown = () => server.close(() => process.exit(0));
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (error) {
      console.error('Unable to start server:', error);
      process.exit(1);
    }
  };
  startServer();
} else {
  // ─── Vercel Serverless: lazy DB init on first request ──────────────────────
  let dbReady = false;
  app.use(async (req, res, next) => {
    if (!dbReady) {
      try {
        await initializeDatabase();
        dbReady = true;
      } catch (err) {
        console.error('DB init error:', err.message);
      }
    }
    next();
  });
}

// Required by Vercel — exports app as the serverless request handler
export default app;
