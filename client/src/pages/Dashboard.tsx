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
  // Welcome modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [welcomeFolderName, setWelcomeFolderName] = useState('');

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

  // Handle board creation from welcome modal
  const handleWelcomeCreate = async () => {
    if (welcomeFolderName.trim() && currentUser) {
      await createFolder(currentUser.uid, welcomeFolderName.trim());
      setWelcomeFolderName('');
      setShowCreateModal(false);
    }
  };

  if (!isLoading && folders.length === 0) {
    return (
      <div className="h-full relative overflow-visible">
        {/* Corkboard background */}
        <div className="absolute inset-0 bg-cork bg-repeat"></div>
        <div className="absolute inset-0 bg-cork-overlay"></div>
        {/* Floating message card */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div className="bg-amber-100/90 backdrop-blur-md p-8 rounded-xl border-2 border-amber-300 shadow-2xl max-w-md text-center">
            <h2 className="text-3xl text-amber-800 mb-4 whitespace-nowrap">🌿 Welcome to Corknote 🌿</h2>
            <p className="text-amber-700 mb-6">You don't have any boards yet.<br/>Create your first board to get started.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 text-white py-3 px-6 rounded-full hover:bg-amber-700 focus:outline-none shadow-md transition"
            >
              Create Board
            </button>
          </div>
          {/* Custom Ghibli-style create board modal */}
          {showCreateModal && (
            <div className="absolute inset-0 backdrop-blur-sm flex items-center justify-center z-20">
              <div className="bg-amber-100 p-8 rounded-xl border-2 border-amber-300 shadow-2xl max-w-sm w-full text-center">
                <h3 className="text-2xl text-amber-800 mb-4">Create Your First Board</h3>
                <input
                  type="text"
                  value={welcomeFolderName}
                  onChange={(e) => setWelcomeFolderName(e.target.value)}
                  placeholder="Board Name"
                  className="w-full p-2 mb-4 rounded border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <div className="flex justify-center gap-4">
                  <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                  </button>
                  <button onClick={handleWelcomeCreate} className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700">
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
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