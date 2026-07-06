import React from 'react';
import StatsGrid from '../components/StatsGrid';
import ProjectOverview from '../components/ProjectOverview';
import TasksSummary from '../components/TasksSummary';
import RecentActivity from '../components/RecentActivity';

export const Dashboard = () => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto text-left">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-1">Workspace Overview</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">
          Overview of your team's workspace performance and progress
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Overview and Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <ProjectOverview />
          <RecentActivity />
        </div>

        {/* Right Column: Tasks Summary */}
        <div>
          <TasksSummary />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
