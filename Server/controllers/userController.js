import db from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getTeamMembers = async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT u.id, u.name, u.email, u.role, u.createdAt,
                    COUNT(t.id) AS totalTasks
             FROM Users u
             LEFT JOIN Tasks t ON t.userId = u.id
             GROUP BY u.id
             ORDER BY u.createdAt DESC`
        );

        return res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching team members:', error);
        return res.status(500).json({ error: 'Server error while fetching team members' });
    }
};

export const inviteTeamMember = async (req, res) => {
    try {
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email address is required' });
        }

        // Check if user already exists
        const [existing] = await db.query('SELECT id FROM Users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'User with this email is already a team member' });
        }

        // Generate name from email prefix
        const namePrefix = email.split('@')[0];
        const name = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1).replace(/[._-]/g, ' ');

        // Hash default temporary password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('invited_user_pwd_123', salt);

        const [result] = await db.query(
            'INSERT INTO Users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, role || 'Member']
        );

        return res.status(201).json({
            id: result.insertId,
            name,
            email,
            role: role || 'Member',
            totalTasks: 0
        });
    } catch (error) {
        console.error('Error inviting team member:', error);
        return res.status(500).json({ error: 'Server error while inviting team member' });
    }
};
