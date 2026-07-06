import { Project, Task } from '../models/index.js';

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const projects = await Project.findAll({
      where: { userId },
      include: [{
        model: Task,
        attributes: ['id', 'status', 'priority']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Format response to include totalTasks, completedTasks, and all detailed fields
    const formattedProjects = projects.map(project => {
      const tasks = project.Tasks || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'Done').length;
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        startDate: project.startDate,
        endDate: project.endDate,
        projectLead: project.projectLead,
        teamMembers: project.teamMembers,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        totalTasks,
        completedTasks
      };
    });

    return res.status(200).json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({ error: 'Server error while fetching projects' });
  }
};

export const createProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, 
      description, 
      status, 
      priority, 
      startDate, 
      endDate, 
      projectLead, 
      teamMembers 
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      description,
      status: status || 'Planning',
      priority: priority || 'Medium',
      startDate: startDate || null,
      endDate: endDate || null,
      projectLead: projectLead || null,
      teamMembers: teamMembers || null,
      userId
    });

    return res.status(201).json({
      ...project.toJSON(),
      totalTasks: 0,
      completedTasks: 0
    });
  } catch (error) {
    console.error('Error creating project:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Server error while creating project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { 
      name, 
      description, 
      status, 
      priority, 
      startDate, 
      endDate, 
      projectLead, 
      teamMembers 
    } = req.body;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this project' });
    }

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate ? startDate : null;
    if (endDate !== undefined) project.endDate = endDate ? endDate : null;
    if (projectLead !== undefined) project.projectLead = projectLead ? projectLead : null;
    if (teamMembers !== undefined) project.teamMembers = teamMembers ? teamMembers : null;

    await project.save();

    // Retrieve project with tasks count
    const tasks = await Task.findAll({ where: { projectId: id } });
    return res.status(200).json({
      ...project.toJSON(),
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'Done').length
    });
  } catch (error) {
    console.error('Error updating project:', error);
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ error: error.errors[0].message });
    }
    return res.status(500).json({ error: 'Server error while updating project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const project = await Project.findByPk(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this project' });
    }

    await project.destroy();

    return res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({ error: 'Server error while deleting project' });
  }
};
