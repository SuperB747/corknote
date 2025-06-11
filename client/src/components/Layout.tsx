import React from 'react';
import Sidebar from './Sidebar';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="h-screen flex overflow-visible relative">
      <Sidebar />
      <main className="flex-1 relative z-10">
        {children}
      </main>
    </div>
  );
};

export default Layout; 