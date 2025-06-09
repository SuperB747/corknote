import React, { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import useNoteStore from '../store/noteStore';
import { useAuth } from '../contexts/AuthContext';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { UserProfile } from './UserProfile';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { folders, selectedFolderId, setSelectedFolder, createFolder, updateFolder, deleteFolder, reorderFolders } = useNoteStore();
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
        <div className="mb-6 p-3 bg-blue-300 rounded-lg text-sm">
          <UserProfile user={currentUser} />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2
          onClick={() => {
            setIsCreatingFolder(true);
            setFolderName('');
          }}
          className="text-sm font-semibold text-gray-800 cursor-pointer"
        >
          새로운 보드 추가
        </h2>
        <button
          onClick={() => {
            setIsCreatingFolder(true);
            setFolderName('');
          }}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <PlusIcon className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {isCreatingFolder && (
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="Folder name"
            className="flex-1 px-3 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <button
            onClick={() => { setIsCreatingFolder(false); setFolderName(''); }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      <Reorder.Group axis="y" values={folders} onReorder={reorderFolders} className="space-y-2 flex-1 overflow-y-auto overscroll-contain scrollbar-container">
        {folders.map((folder) => (
          <Reorder.Item
            key={folder.id}
            value={folder}
            onClick={() => setSelectedFolder(folder.id)}
            className={`flex items-center justify-between rounded-lg p-2 text-sm cursor-pointer border ${
              selectedFolderId === folder.id
                ? 'bg-blue-200 border-blue-400'
                : 'border-transparent hover:bg-gray-200 hover:border-gray-350'
            } mb-1`}
          >
            {isEditingFolder === folder.id ? (
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateFolder(folder.id)}
                onBlur={() => handleUpdateFolder(folder.id)}
                className="flex-1 px-2 py-1 border rounded-md"
                autoFocus
              />
            ) : (
              <>
                <button
                  onClick={() => setSelectedFolder(folder.id)}
                  className="flex items-center justify-start flex-1 pl-2 text-gray-700 min-w-0"
                >
                  <FolderIcon className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="flex-1 min-w-0 truncate text-left">{folder.name}</span>
                </button>
                <div className="flex pr-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); startEditing(folder); }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <PencilIcon className="w-4 h-4 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                  >
                    <TrashIcon className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </>
            )}
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
};

export default Sidebar; 