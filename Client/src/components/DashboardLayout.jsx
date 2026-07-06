import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

export const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 dark:bg-zinc-900">
      {/* Sidebar */}
      <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      
      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navbar */}
        <Navbar setIsSidebarOpen={setIsSidebarOpen} />
        
        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-zinc-950">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

