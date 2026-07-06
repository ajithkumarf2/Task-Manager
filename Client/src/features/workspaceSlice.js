import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../context/AuthContext';

const normalizeStatusFromDb = (dbStatus) => {
  if (!dbStatus) return 'TODO';
  const s = dbStatus.toUpperCase();
  if (s === 'TO DO' || s === 'TODO') return 'TODO';
  if (s === 'IN PROGRESS' || s === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (s === 'DONE') return 'DONE';
  return 'TODO';
};

const normalizePriorityFromDb = (dbPriority) => {
  if (!dbPriority) return 'MEDIUM';
  const p = dbPriority.toUpperCase();
  if (p === 'LOW') return 'LOW';
  if (p === 'MEDIUM') return 'MEDIUM';
  if (p === 'HIGH') return 'HIGH';
  return 'MEDIUM';
};

const normalizeStatusToDb = (feStatus) => {
  if (!feStatus) return 'To Do';
  const s = feStatus.toUpperCase();
  if (s === 'TODO') return 'To Do';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'DONE') return 'Done';
  return 'To Do';
};

const normalizePriorityToDb = (fePriority) => {
  if (!fePriority) return 'Medium';
  const p = fePriority.toUpperCase();
  if (p === 'LOW') return 'Low';
  if (p === 'MEDIUM') return 'Medium';
  if (p === 'HIGH') return 'High';
  return 'Medium';
};

const normalizeProjectStatusFromDb = (dbStatus) => {
  if (!dbStatus) return 'PLANNING';
  const s = dbStatus.toUpperCase();
  if (s === 'PLANNING') return 'PLANNING';
  if (s === 'ACTIVE') return 'ACTIVE';
  if (s === 'COMPLETED') return 'COMPLETED';
  if (s === 'ON HOLD' || s === 'ON_HOLD') return 'ON_HOLD';
  if (s === 'CANCELLED') return 'CANCELLED';
  return 'PLANNING';
};

const normalizeProjectStatusToDb = (feStatus) => {
  if (!feStatus) return 'Planning';
  const s = feStatus.toUpperCase();
  if (s === 'PLANNING') return 'Planning';
  if (s === 'ACTIVE') return 'Active';
  if (s === 'COMPLETED') return 'Completed';
  if (s === 'ON_HOLD') return 'On Hold';
  if (s === 'CANCELLED') return 'Cancelled';
  return 'Planning';
};

// Helper to construct workspace state from raw backend data
const constructWorkspace = (currentUser, projects, tasks, users) => {
  if (!currentUser) return null;

  // Map users to workspace members format
  const workspaceMembers = users.map(u => {
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random`;
    return {
      id: u.id,
      role: u.role || 'Member',
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role || 'Member',
        image: avatar
      }
    };
  });

  // Build projects with their nested tasks and members
  const projectsWithDetails = projects.map(proj => {
    // Determine project team members based on emails stored in proj.teamMembers array
    let emails = [];
    try {
      if (typeof proj.teamMembers === 'string') {
        emails = JSON.parse(proj.teamMembers);
      } else if (Array.isArray(proj.teamMembers)) {
        emails = proj.teamMembers;
      }
    } catch (e) {
      emails = proj.teamMembers ? String(proj.teamMembers).split(',').map(s => s.trim()) : [];
    }

    const projectMembers = workspaceMembers.filter(m => emails.includes(m.user.email));

    // Filter tasks belonging to this project
    const projectTasks = tasks
      .filter(t => String(t.projectId) === String(proj.id))
      .map(t => {
        // Find assignee user
        const assigneeUser = users.find(u => u.id === t.userId);
        return {
          id: t.id,
          projectId: t.projectId,
          title: t.title,
          description: t.description || '',
          type: t.type || 'TASK',
          status: normalizeStatusFromDb(t.status),
          priority: normalizePriorityFromDb(t.priority),
          due_date: t.dueDate || t.due_date || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
          assignee: assigneeUser ? {
            id: assigneeUser.id,
            name: assigneeUser.name,
            email: assigneeUser.email,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(assigneeUser.name)}&background=random`
          } : null
        };
      });

    // Calculate progress as % of completed tasks
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: proj.id,
      name: proj.name,
      description: proj.description || '',
      status: normalizeProjectStatusFromDb(proj.status),
      priority: normalizePriorityFromDb(proj.priority),
      start_date: proj.startDate || proj.start_date || new Date().toISOString(),
      end_date: proj.endDate || proj.end_date || new Date().toISOString(),
      progress,
      team_lead: proj.lead || '',
      members: projectMembers,
      tasks: projectTasks
    };
  });

  return {
    id: 'org_1',
    name: 'Ak Workspace',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=80&auto=format&fit=crop&q=60',
    owner: {
      email: currentUser.email,
      name: currentUser.name,
      id: currentUser.id
    },
    projects: projectsWithDetails,
    members: workspaceMembers
  };
};

export const fetchWorkspaceData = createAsyncThunk(
  'workspace/fetchData',
  async (currentUser, { rejectWithValue }) => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks'),
        api.get('/users')
      ]);
      return {
        currentUser,
        projects: projectsRes.data,
        tasks: tasksRes.data,
        users: usersRes.data
      };
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// CRUD Thunks
export const createProject = createAsyncThunk(
  'workspace/createProject',
  async (projectData, { rejectWithValue }) => {
    try {
      const dbProjectData = {
        ...projectData,
        status: normalizeProjectStatusToDb(projectData.status),
        priority: normalizePriorityToDb(projectData.priority)
      };
      const response = await api.post('/projects', dbProjectData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateProject = createAsyncThunk(
  'workspace/updateProject',
  async ({ id, projectData }, { rejectWithValue }) => {
    try {
      const dbProjectData = {
        ...projectData,
        status: normalizeProjectStatusToDb(projectData.status),
        priority: normalizePriorityToDb(projectData.priority)
      };
      const response = await api.put(`/projects/${id}`, dbProjectData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createTask = createAsyncThunk(
  'workspace/createTask',
  async (taskData, { rejectWithValue }) => {
    try {
      const dbTaskData = {
        ...taskData,
        status: normalizeStatusToDb(taskData.status),
        priority: normalizePriorityToDb(taskData.priority)
      };
      const response = await api.post('/tasks', dbTaskData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateTask = createAsyncThunk(
  'workspace/updateTask',
  async (taskData, { rejectWithValue }) => {
    try {
      // Map frontend task schema fields back to backend naming
      const mapped = {
        title: taskData.title,
        description: taskData.description,
        status: normalizeStatusToDb(taskData.status),
        priority: normalizePriorityToDb(taskData.priority),
        type: taskData.type,
        dueDate: taskData.due_date,
        userId: taskData.assigneeId || taskData.userId || null,
        projectId: taskData.projectId || null
      };
      const response = await api.put(`/tasks/${taskData.id}`, mapped);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteTask = createAsyncThunk(
  'workspace/deleteTask',
  async (taskIds, { rejectWithValue }) => {
    try {
      const ids = Array.isArray(taskIds) ? taskIds : [taskIds];
      await Promise.all(ids.map(id => api.delete(`/tasks/${id}`)));
      return ids;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addProjectMember = createAsyncThunk(
  'workspace/addProjectMember',
  async ({ projectId, email }, { rejectWithValue }) => {
    try {
      // Fetch project details first
      const projRes = await api.get(`/projects`);
      const proj = projRes.data.find(p => p.id === projectId);
      if (!proj) throw new Error('Project not found');

      let emails = [];
      try {
        if (typeof proj.teamMembers === 'string') {
          emails = JSON.parse(proj.teamMembers);
        } else if (Array.isArray(proj.teamMembers)) {
          emails = proj.teamMembers;
        }
      } catch (e) {
        emails = proj.teamMembers ? String(proj.teamMembers).split(',').map(s => s.trim()) : [];
      }

      if (!emails.includes(email)) {
        emails.push(email);
      }

      const response = await api.put(`/projects/${projectId}`, {
        teamMembers: JSON.stringify(emails)
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const inviteTeamMember = createAsyncThunk(
  'workspace/inviteTeamMember',
  async (inviteData, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/invite', inviteData);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: {
    workspaces: [],
    currentWorkspace: null,
    loading: false,
    error: null,
    rawProjects: [],
    rawTasks: [],
    rawUsers: [],
    currentUser: null
  },
  reducers: {
    setCurrentWorkspace: (state, action) => {
      // Since we only have one workspace for now, just keep it active
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Data
      .addCase(fetchWorkspaceData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWorkspaceData.fulfilled, (state, action) => {
        state.loading = false;
        state.currentUser = action.payload.currentUser;
        state.rawProjects = action.payload.projects;
        state.rawTasks = action.payload.tasks;
        state.rawUsers = action.payload.users;
        
        state.currentWorkspace = constructWorkspace(
          action.payload.currentUser,
          action.payload.projects,
          action.payload.tasks,
          action.payload.users
        );
        state.workspaces = state.currentWorkspace ? [state.currentWorkspace] : [];
      })
      .addCase(fetchWorkspaceData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Project
      .addCase(createProject.fulfilled, (state, action) => {
        state.rawProjects.unshift(action.payload);
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        state.rawProjects = state.rawProjects.map(p =>
          p.id === action.payload.id ? action.payload : p
        );
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Create Task
      .addCase(createTask.fulfilled, (state, action) => {
        state.rawTasks.push(action.payload);
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Update Task
      .addCase(updateTask.fulfilled, (state, action) => {
        state.rawTasks = state.rawTasks.map(t =>
          String(t.id) === String(action.payload.id) ? action.payload : t
        );
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Delete Task
      .addCase(deleteTask.fulfilled, (state, action) => {
        const deletedIds = action.payload;
        state.rawTasks = state.rawTasks.filter(t => !deletedIds.map(String).includes(String(t.id)));
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Add Project Member / Update project lead/members
      .addCase(addProjectMember.fulfilled, (state, action) => {
        state.rawProjects = state.rawProjects.map(p =>
          p.id === action.payload.id ? action.payload : p
        );
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      })

      // Invite Team Member
      .addCase(inviteTeamMember.fulfilled, (state, action) => {
        state.rawUsers.push(action.payload);
        state.currentWorkspace = constructWorkspace(
          state.currentUser,
          state.rawProjects,
          state.rawTasks,
          state.rawUsers
        );
        state.workspaces = [state.currentWorkspace];
      });
  }
});

export const { setCurrentWorkspace } = workspaceSlice.actions;
export default workspaceSlice.reducer;
