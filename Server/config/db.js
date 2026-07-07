import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const dbHost = process.env.DB_HOST;
const dbPort = parseInt(process.env.DB_PORT || '3306', 10);
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const dbName = process.env.DB_NAME;

// Determine if SSL should be used (cloud providers require it; localhost does not)
const isLocalhost = dbHost === 'localhost' || dbHost === '127.0.0.1';
const dialectOptions = isLocalhost
  ? {}
  : {
      ssl: {
        require: true,
        rejectUnauthorized: false // needed for most managed cloud MySQL providers
      }
    };

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: 'mysql',
  logging: false,
  dialectOptions,
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
