import db from '../config/db.js';

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


export const getProjects = async (req, res) => {
    try {
        const userId = req.user.id;

        const [projects] = await db.query(
            'SELECT * FROM Projects WHERE userId = ? ORDER BY createdAt DESC',
            [userId]
        );

        // Get task counts per project
        const projectIds = projects.map(p => p.id);
        let taskCounts = {};

        if (projectIds.length > 0) {
            const [tasks] = await db.query(
                `SELECT projectId, status FROM Tasks WHERE projectId IN (?)`,
                [projectIds]
            );
            for (const task of tasks) {
                if (!taskCounts[task.projectId]) taskCounts[task.projectId] = { total: 0, done: 0 };
                taskCounts[task.projectId].total++;
                if (task.status === 'Done') taskCounts[task.projectId].done++;
            }
        }

        const formatted = projects.map(project => ({
            ...project,
            totalTasks: taskCounts[project.id]?.total || 0,
            completedTasks: taskCounts[project.id]?.done || 0
        }));

        return res.status(200).json(formatted);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return res.status(500).json({ error: 'Server error while fetching projects' });
    }
};

export const createProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, status, priority, startDate, endDate, projectLead, teamMembers } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Project name is required' });
        }

        const [result] = await db.query(
            `INSERT INTO Projects (name, description, status, priority, startDate, endDate, projectLead, teamMembers, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                status || 'Planning',
                priority || 'Medium',
                formatDateForDb(startDate),
                formatDateForDb(endDate),
                projectLead || null,
                teamMembers || null,
                userId
            ]
        );

        const [rows] = await db.query('SELECT * FROM Projects WHERE id = ?', [result.insertId]);
        return res.status(201).json({ ...rows[0], totalTasks: 0, completedTasks: 0 });
    } catch (error) {
        console.error('Error creating project:', error);
        return res.status(500).json({ error: 'Server error while creating project' });
    }
};

export const updateProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, status, priority, startDate, endDate, projectLead, teamMembers } = req.body;

        const [existing] = await db.query('SELECT * FROM Projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (existing[0].userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to modify this project' });
        }

        const p = existing[0];
        await db.query(
            `UPDATE Projects SET
                name = ?, description = ?, status = ?, priority = ?,
                startDate = ?, endDate = ?, projectLead = ?, teamMembers = ?,
                updatedAt = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
                name !== undefined ? name : p.name,
                description !== undefined ? description : p.description,
                status !== undefined ? status : p.status,
                priority !== undefined ? priority : p.priority,
                startDate !== undefined ? formatDateForDb(startDate) : p.startDate,
                endDate !== undefined ? formatDateForDb(endDate) : p.endDate,
                projectLead !== undefined ? (projectLead || null) : p.projectLead,
                teamMembers !== undefined ? (teamMembers || null) : p.teamMembers,
                id
            ]
        );

        const [updated] = await db.query('SELECT * FROM Projects WHERE id = ?', [id]);
        const [tasks] = await db.query('SELECT status FROM Tasks WHERE projectId = ?', [id]);

        return res.status(200).json({
            ...updated[0],
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'Done').length
        });
    } catch (error) {
        console.error('Error updating project:', error);
        return res.status(500).json({ error: 'Server error while updating project' });
    }
};

export const deleteProject = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const [existing] = await db.query('SELECT * FROM Projects WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (existing[0].userId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this project' });
        }

        await db.query('DELETE FROM Projects WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Error deleting project:', error);
        return res.status(500).json({ error: 'Server error while deleting project' });
    }
};
