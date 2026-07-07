import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// Test the connection on startup
try {
    const connection = await db.getConnection();
    console.log('Database connection established successfully.');
    connection.release();
} catch (error) {
    console.error('Unable to connect to the database:', error.message);
}

export default db;
