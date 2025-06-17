import React from 'react';
import { Helmet } from 'react-helmet-async';
import Sidebar from './Sidebar';
import useNoteStore from '../store/noteStore';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isDragging = useNoteStore(state => state.isDragging);
  return (
    <>
      <Helmet>
        <title>CorkNote</title>
        <meta name="description" content="CorkNote is a free, intuitive corkboard-style note-taking app." />
      </Helmet>
      <div className="h-screen">
        <Sidebar />
        <main className="relative h-full ml-64">
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout; 