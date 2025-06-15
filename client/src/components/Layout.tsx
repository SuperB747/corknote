import React from 'react';
import Sidebar from './Sidebar';
import useNoteStore from '../store/noteStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDragging = useNoteStore(state => state.isDragging);
  return (
    <div className="h-screen">
      <Sidebar />
      <main className="relative h-full ml-64">
        {children}
      </main>
    </div>
  );
};

export default Layout; 