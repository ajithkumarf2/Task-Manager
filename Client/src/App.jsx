import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchWorkspaceData } from './features/workspaceSlice';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './pages/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Team from './pages/Team';
import ProjectDetails from './pages/ProjectDetails';
import TaskDetails from './pages/TaskDetails';
import { Toaster } from 'react-hot-toast';

const AppContent = () => {
  const { isAuthenticated, loading, user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Load Redux workspace context once user is verified
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchWorkspaceData(user));
    }
  }, [isAuthenticated, user, dispatch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-100 transition-colors duration-200">
        <span className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/signup" element={<Signup navigate={navigate} />} />
        <Route path="/login" element={<Login navigate={navigate} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/team" element={<Team />} />
        <Route path="/projectsDetail" element={<ProjectDetails />} />
        <Route path="/taskDetails" element={<TaskDetails />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster 
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff'
            }
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff'
            }
          }
        }}
      />
    </AuthProvider>
  );
}
