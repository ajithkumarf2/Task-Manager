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

// Enable CORS for frontend communication
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).json({ message: 'Task Manager API', status: 'running' });
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

// Initialize DB tables then start server (local dev only)
// Vercel runs as serverless — it imports `app` directly via vercel.json
if (process.env.VERCEL !== '1') {
  const startServer = async () => {
    try {
      await initializeDatabase();
      console.log('All database tables verified/created successfully.');

      const server = app.listen(PORT, () => {
        console.log(`Server successfully started on port ${PORT}`);
      });

      const shutdown = () => {
        server.close(() => {
          console.log('Server shut down gracefully.');
          process.exit(0);
        });
      };

      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    } catch (error) {
      console.error('Unable to initialize database or start server:', error);
      process.exit(1);
    }
  };

  startServer();
} else {
  // On Vercel: initialize DB on first request (lazy init)
  let dbInitialized = false;
  app.use(async (req, res, next) => {
    if (!dbInitialized) {
      try {
        await initializeDatabase();
        dbInitialized = true;
      } catch (err) {
        console.error('DB init failed:', err.message);
      }
    }
    next();
  });
}

export default app;
