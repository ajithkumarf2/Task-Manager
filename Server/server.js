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

// Enable CORS (Explicit origins are required when credentials are set to true)
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://task-mgt-blond.vercel.app',
    'https://task-manager-server-eosin.vercel.app'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.status(200).send('Task Manager API is running');
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

// Lazy DB initialization middleware for Vercel Serverless
let dbReady = false;
app.use(async (req, res, next) => {
  if (!dbReady) {
    try {
      await initializeDatabase();
      dbReady = true;
    } catch (err) {
      console.error('DB initialization failed:', err.message);
    }
  }
  next();
});

// Start HTTP server locally, export for Vercel
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await initializeDatabase();
      dbReady = true;
      console.log('All database tables verified/created successfully.');

      const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
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
      console.error('Unable to start local server:', error);
      process.exit(1);
    }
  };
  startServer();
}

export default app;
