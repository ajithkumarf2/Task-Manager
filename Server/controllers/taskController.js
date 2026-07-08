import db from '../config/db.js';

// Normalize frontend values to match DB ENUM casing
const PRIORITY_MAP = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', low: 'Low', medium: 'Medium', high: 'High' };
const STATUS_MAP = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done', todo: 'To Do', in_progress: 'In Progress', done: 'Done' };

const normalizePriority = (val) => PRIORITY_MAP[val] ?? val ?? 'Medium';
const normalizeStatus = (val) => STATUS_MAP[val] ?? val ?? 'To Do';

const formatDateForDb = (dateVal) => {
    if (!dateVal) return null;
    try {
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return null;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return null;
    }
};

export const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, priority, projectId } = req.query;

        let query = 'SELECT * FROM Tasks WHERE userId = ?';
        const params = [userId];

        if (status) { query += ' AND status = ?'; params.push(status); }
        if (priority) { query += ' AND priority = ?'; params.push(priority); }
        if (projectId) {
            query += ' AND projectId = ?';
            params.push(projectId === 'null' ? null : projectId);
        }

        query += ' ORDER BY createdAt DESC';

        const [tasks] = await db.query(query, params);
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

        const [result] = await db.query(
            `INSERT INTO Tasks (title, description, dueDate, priority, status, type, userId, projectId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                description || null,
                formatDateForDb(dueDate),
                normalizePriority(priority),
                normalizeStatus(status),
                type || 'TASK',
                userId || currentUserId,
                projectId || null
            ]
        );

        const [rows] = await db.query('SELECT * FROM Tasks WHERE id = ?', [result.insertId]);
        return res.status(201).json(rows[0]);
    } catch (error) {
        console.error('Error creating task:', error);
        return res.status(500).json({ error: 'Server error while creating task' });
    }
};

export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, dueDate, priority, status, projectId, type, userId } = req.body;

        const [existing] = await db.query('SELECT * FROM Tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = existing[0];

        await db.query(
            `UPDATE Tasks SET
                title = ?, description = ?, dueDate = ?, priority = ?, status = ?,
                type = ?, userId = ?, projectId = ?, updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                title !== undefined ? title : task.title,
                description !== undefined ? description : task.description,
                dueDate !== undefined ? formatDateForDb(dueDate) : task.dueDate,
                priority !== undefined ? normalizePriority(priority) : task.priority,
                status !== undefined ? normalizeStatus(status) : task.status,
                type !== undefined ? type : task.type,
                userId !== undefined ? userId : task.userId,
                projectId !== undefined ? (projectId || null) : task.projectId,
                id
            ]
        );

        const [updated] = await db.query('SELECT * FROM Tasks WHERE id = ?', [id]);
        return res.status(200).json(updated[0]);
    } catch (error) {
        console.error('Error updating task:', error);
        return res.status(500).json({ error: 'Server error while updating task' });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [existing] = await db.query('SELECT * FROM Tasks WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Task not found' });
        }

        if (existing[0].userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this task' });
        }

        await db.query('DELETE FROM Tasks WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        return res.status(500).json({ error: 'Server error while deleting task' });
    }
};
