import React, { useEffect, useState } from 'react';
import Corkboard from '../components/Corkboard';
import { useAuth } from '../contexts/AuthContext';
import useNoteStore from '../store/noteStore';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    folders,
    selectedFolderId,
    setSelectedFolder,
    loadFolders,
    loadNotes,
    createNote,
    createFolder,
    error,
    isLoading
  } = useNoteStore();
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser && folders.length > 0 && !selectedFolderId) {
      const last = localStorage.getItem('lastFolderId');
      if (last && folders.some(f => f.id === last)) {
        setSelectedFolder(last);
      } else {
        setSelectedFolder(folders[0].id);
      }
    }
  }, [currentUser, folders, selectedFolderId, setSelectedFolder]);

  useEffect(() => {
    if (selectedFolderId) {
      localStorage.setItem('lastFolderId', selectedFolderId);
    }
  }, [selectedFolderId]);

  useEffect(() => {
    if (currentUser) {
      loadFolders(currentUser.uid);
    }
  }, [currentUser, loadFolders]);

  useEffect(() => {
    if (currentUser && selectedFolderId) {
      loadNotes(currentUser.uid, selectedFolderId);
    }
  }, [currentUser, selectedFolderId, loadNotes]);

  if (!isLoading && folders.length === 0) {
    return (
      <div className="h-full relative overflow-visible">
        {/* Corkboard background */}
        <div className="absolute inset-0 bg-cork bg-repeat"></div>
        <div className="absolute inset-0 bg-cork-overlay"></div>
        {/* Floating message card */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-lg shadow-lg max-w-sm text-center">
            <h2 className="text-2xl font-bold mb-4">Welcome to Corknote!</h2>
            <p className="text-gray-700 mb-6">You don't have any boards yet.<br/>Create your first board to get started.</p>
            <button
              onClick={async () => {
                const name = window.prompt('Enter board name');
                if (name && currentUser) {
                  await createFolder(currentUser.uid, name.trim());
                }
              }}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 focus:outline-none"
            >
              Create Board
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateNote = async () => {
    if (currentUser && selectedFolderId) {
      try {
        const newNote = await createNote(currentUser.uid, 'New Note', 'Click to edit');
        setNewNoteId(newNote.id);
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-visible">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded absolute top-0 left-0 right-0 z-50">
          {error}
        </div>
      )}
      <div className="flex-1 relative">
        <Corkboard newNoteId={newNoteId ?? undefined} onNewNoteHandled={() => setNewNoteId(null)} />
        {selectedFolderId && (
          <button
            onClick={handleCreateNote}
            className="absolute bottom-6 right-6 text-blue-600 hover:text-blue-700 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg backdrop-blur-sm z-10"
            title="Add New Note"
          >
            <PlusCircleIcon className="w-12 h-12" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 