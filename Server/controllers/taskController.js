import { Task } from '../models/index.js';

export const getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, priority, projectId } = req.query;

    const whereClause = { userId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    if (projectId) {
      whereClause.projectId = projectId === 'null' ? null : projectId;
    }

    const tasks = await Task.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Server error while fetching tasks' });
  }
};

export const createTask = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { title, description, dueDate, priority, status, projectId, type, userId } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await Task.create({
      title,
      description,
      dueDate: dueDate || null,
      priority: priority || 'Medium',
      status: status || 'To Do',
      userId: userId || currentUserId,
      projectId: projectId || null,
      type: type || 'TASK'
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Server error while creating task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { id } = req.params;
    const { title, description, dueDate, priority, status, projectId, type, userId } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate ? dueDate : null;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (projectId !== undefined) task.projectId = projectId ? projectId : null;
    if (type !== undefined) task.type = type;
    if (userId !== undefined) task.userId = userId;

    await task.save();

    return res.status(200).json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Server error while updating task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (task.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this task' });
    }

    await task.destroy();

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Server error while deleting task' });
  }
};
