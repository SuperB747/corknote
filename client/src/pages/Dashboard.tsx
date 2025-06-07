import React, { useEffect, useState } from 'react';
import Corkboard from '../components/Corkboard';
import { useAuth } from '../contexts/AuthContext';
import useNoteStore from '../store/noteStore';
import { PlusCircleIcon } from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    selectedFolderId,
    loadFolders,
    loadNotes,
    createNote,
    error
  } = useNoteStore();
  const [newNoteId, setNewNoteId] = useState<string | null>(null);

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
    <div className="h-full flex flex-col relative overflow-hidden">
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