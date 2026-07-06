import { User, Task } from '../models/index.js';
import bcrypt from 'bcryptjs';

export const getTeamMembers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
      include: [{
        model: Task,
        attributes: ['id', 'status']
      }]
    });

    const formatted = users.map(user => {
      const tasks = user.Tasks || [];
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        totalTasks: tasks.length
      };
    });

    return res.status(200).json(formatted);
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
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email is already a team member' });
    }

    // Generate name from email (capitalize prefix)
    const namePrefix = email.split('@')[0];
    const name = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1).replace(/[._-]/g, ' ');

    // Create user with default temporary password
    const tempPassword = 'invited_user_pwd_123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Member'
    });

    return res.status(201).json({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
      totalTasks: 0
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    return res.status(500).json({ error: 'Server error while inviting team member' });
  }
};
