import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/db.js';
import './models/index.js'; // Import to ensure associations are registered
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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Task Manager API is running' });
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

// Sync Database and Start Server
async function startServer() {
  try {
    // Authenticate Sequelize connection
    await sequelize.authenticate();
    console.log('Sequelize database connection established successfully.');

    // Sync models (force: false creates tables if they do not exist)
    await sequelize.sync({ force: false });
    console.log('Sequelize models synchronized with database.');

    // Dynamic column check/migration for tasks & projects
    try {
      const queryInterface = sequelize.getQueryInterface();
      
      // 1. Check Tasks Table
      const tasksTableInfo = await queryInterface.describeTable('Tasks');
      if (!tasksTableInfo.projectId) {
        const { DataTypes } = await import('sequelize');
        await queryInterface.addColumn('Tasks', 'projectId', {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: {
            model: 'Projects',
            key: 'id'
          },
          onDelete: 'CASCADE'
        });
        console.log('Successfully added projectId column to Tasks table.');
      }
      if (!tasksTableInfo.type) {
        const { DataTypes } = await import('sequelize');
        await queryInterface.addColumn('Tasks', 'type', {
          type: DataTypes.STRING,
          defaultValue: 'TASK',
          allowNull: false
        });
        console.log('Successfully added type column to Tasks table.');
      }

      // 2. Check Projects Table
      const projectsTableInfo = await queryInterface.describeTable('Projects');
      const { DataTypes } = await import('sequelize');
      const newProjectColumns = {
        status: {
          type: DataTypes.ENUM('Planning', 'Active', 'Completed', 'On Hold'),
          defaultValue: 'Planning',
          allowNull: false
        },
        priority: {
          type: DataTypes.ENUM('Low', 'Medium', 'High'),
          defaultValue: 'Medium',
          allowNull: false
        },
        startDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        endDate: {
          type: DataTypes.DATEONLY,
          allowNull: true
        },
        projectLead: {
          type: DataTypes.STRING,
          allowNull: true
        },
        teamMembers: {
          type: DataTypes.TEXT,
          allowNull: true
        }
      };

      for (const [colName, colSpec] of Object.entries(newProjectColumns)) {
        if (!projectsTableInfo[colName]) {
          await queryInterface.addColumn('Projects', colName, colSpec);
          console.log(`Successfully added ${colName} column to Projects table.`);
        }
      }

      // 3. Check Users Table
      const usersTableInfo = await queryInterface.describeTable('Users');
      if (!usersTableInfo.role) {
        const { DataTypes } = await import('sequelize');
        await queryInterface.addColumn('Users', 'role', {
          type: DataTypes.ENUM('Admin', 'Member'),
          defaultValue: 'Member',
          allowNull: false
        });
        console.log('Successfully added role column to Users table.');
      }
    } catch (columnError) {
      console.error('Error verifying or migrating database tables:', columnError.message);
    }

    app.listen(PORT, () => {
      console.log(`Server successfully started on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to initialize database or start server:', error);
    process.exit(1);
  }
}

startServer();
