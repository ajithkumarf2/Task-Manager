import sequelize from '../config/db.js';
import User from './User.js';
import Task from './Task.js';
import Project from './Project.js';

// Define relationships
User.hasMany(Task, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  hooks: true
});

Task.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Project, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
  hooks: true
});

Project.belongsTo(User, {
  foreignKey: 'userId'
});

Project.hasMany(Task, {
  foreignKey: 'projectId',
  onDelete: 'CASCADE',
  hooks: true
});

Task.belongsTo(Project, {
  foreignKey: 'projectId'
});

export {
  sequelize,
  User,
  Task,
  Project
};
