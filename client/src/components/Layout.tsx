import React from 'react';
import Sidebar from './Sidebar';
import useNoteStore from '../store/noteStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isNoteDragging } = useNoteStore();
  return (
    <div className="h-screen flex overflow-visible">
      <Sidebar />
      <main className={`flex-1 relative ${isNoteDragging ? 'z-30' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 