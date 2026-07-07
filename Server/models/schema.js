import db from '../config/db.js';

// Reusable helper to execute schema definitions cleanly
const executeSchemaQuery = async (query, tableName) => {
    try {
        await db.query(query);
        console.log(` ${tableName} table verified/created successfully`);
    } catch (error) {
        console.error(` Error setting up ${tableName} table:`, error.message);
    }
};

// Create Users table
export const createUsersTable = async () => {
    const createTable = `
        CREATE TABLE IF NOT EXISTS Users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('Admin', 'Member') DEFAULT 'Member' NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    await executeSchemaQuery(createTable, "Users");
};

// Create Projects table (depends on Users)
export const createProjectsTable = async () => {
    const createTable = `
        CREATE TABLE IF NOT EXISTS Projects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            status ENUM('Planning', 'Active', 'Completed', 'On Hold') DEFAULT 'Planning' NOT NULL,
            priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium' NOT NULL,
            startDate DATE,
            endDate DATE,
            projectLead VARCHAR(255),
            teamMembers TEXT,
            userId INT NOT NULL,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
        )
    `;
    await executeSchemaQuery(createTable, "Projects");
};

// Create Tasks table (depends on Users and Projects)
export const createTasksTable = async () => {
    const createTable = `
        CREATE TABLE IF NOT EXISTS Tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            dueDate DATE,
            priority ENUM('Low', 'Medium', 'High') DEFAULT 'Medium' NOT NULL,
            status ENUM('To Do', 'In Progress', 'Done') DEFAULT 'To Do' NOT NULL,
            type VARCHAR(50) DEFAULT 'TASK' NOT NULL,
            userId INT NOT NULL,
            projectId INT,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
            FOREIGN KEY (projectId) REFERENCES Projects(id) ON DELETE CASCADE
        )
    `;
    await executeSchemaQuery(createTable, "Tasks");
};

// Initialize all tables in correct dependency order
export const initializeDatabase = async () => {
    await createUsersTable();
    await createProjectsTable();
    await createTasksTable();
};
