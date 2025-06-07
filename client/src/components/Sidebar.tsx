import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useNoteStore from '../store/noteStore';
import { useAuth } from '../contexts/AuthContext';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { UserProfile } from './UserProfile';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { folders, selectedFolderId, setSelectedFolder, createFolder, updateFolder, deleteFolder } = useNoteStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');

  const handleCreateFolder = async () => {
    if (!currentUser || !folderName.trim()) return;
    
    await createFolder(currentUser.uid, folderName.trim());
    setIsCreatingFolder(false);
    setFolderName('');
  };

  const handleUpdateFolder = async (folderId: string) => {
    if (!folderName.trim()) return;
    
    await updateFolder(folderId, folderName.trim());
    setIsEditingFolder(null);
    setFolderName('');
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (window.confirm('Are you sure you want to delete this folder and all its notes?')) {
      await deleteFolder(folderId);
    }
  };

  const startEditing = (folder: { id: string; name: string }) => {
    setIsEditingFolder(folder.id);
    setFolderName(folder.name);
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col h-full">
      {currentUser && (
        <div className="mb-6 pb-4 border-b border-gray-200">
          <UserProfile user={currentUser} />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">새로운 보드 추가</h2>
        <button
          onClick={() => {
            setIsCreatingFolder(true);
            setFolderName('');
          }}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <PlusIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {isCreatingFolder && (
        <div className="mb-4">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            className="w-full px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
        </div>
      )}

      <div className="space-y-1 flex-1 overflow-y-auto">
        {folders.map((folder) => (
          <motion.div
            key={folder.id}
            className={`flex items-center justify-between rounded-md ${
              selectedFolderId === folder.id
                ? 'bg-gray-100'
                : 'hover:bg-gray-50'
            }`}
          >
            {isEditingFolder === folder.id ? (
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateFolder(folder.id)}
                onBlur={() => handleUpdateFolder(folder.id)}
                className="flex-1 px-3 py-2 border rounded-md m-1"
                autoFocus
              />
            ) : (
              <>
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className="flex items-center flex-1 px-3 py-2 text-gray-600"
                >
                  <FolderIcon className="w-5 h-5 mr-2" />
                  <span className="truncate">{folder.name}</span>
                </button>
                <div className="flex pr-2">
                  <button
                    onClick={() => startEditing(folder)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar; 