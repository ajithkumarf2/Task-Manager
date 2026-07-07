import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true
  }
});

// Test the connection
try {
  await sequelize.authenticate();
  console.log(`Connected to database "${dbName}" successfully.`);
} catch (error) {
  console.error('Unable to connect to the database:', error.message);
}

export default sequelize;
