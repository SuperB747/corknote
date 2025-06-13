import React from 'react';
import Sidebar from './Sidebar';
import useNoteStore from '../store/noteStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDragging = useNoteStore(state => state.isDragging);
  return (
    <div className="h-screen flex overflow-hidden overscroll-none">
      <Sidebar />
      <main className={`flex-1 relative ${isDragging ? 'z-30' : ''}`}>
        {children}
      </main>
    </div>
  );
};

export default Layout; 