import React, { useState } from 'react';
// @ts-ignore
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
  const [folderToDelete, setFolderToDelete] = useState<{id: string; name: string} | null>(null);

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

  const handleDeleteFolder = (folder: { id: string; name: string }) => {
    setFolderToDelete(folder);
  };

  const confirmDeleteFolder = async () => {
    if (!folderToDelete) return;
    await deleteFolder(folderToDelete.id);
    setFolderToDelete(null);
  };

  const cancelDeleteFolder = () => setFolderToDelete(null);

  const startEditing = (folder: { id: string; name: string }) => {
    setIsEditingFolder(folder.id);
    setFolderName(folder.name);
  };

  return (
    <div id="sidebar" className="relative z-20 w-64 bg-amber-50 border-r border-amber-200 p-4 flex flex-col h-full shadow-xl">
      {currentUser && (
        <div className="mb-6 p-3 bg-amber-200 rounded-lg text-amber-800 text-sm border border-amber-300 shadow-md">
          <UserProfile user={currentUser} />
        </div>
      )}
      
      <div className="flex justify-between items-center mb-4">
        <h2
          onClick={() => {
            setIsCreatingFolder(true);
            setFolderName('');
          }}
          className="text-sm font-semibold text-amber-800 cursor-pointer hover:text-amber-700"
        >
          Add New Board
        </h2>
        <button
          onClick={() => {
            setIsCreatingFolder(true);
            setFolderName('');
          }}
          className="p-1 hover:bg-amber-100 rounded-full"
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

      <Reorder.Group initial={false} axis="y" values={folders} onReorder={reorderFolders} className="space-y-2 flex-1 overflow-y-auto overscroll-contain scrollbar-container">
        {folders.map((folder) => (
          <Reorder.Item initial={false}
            key={folder.id}
            data-folder-id={folder.id}
            value={folder}
            onClick={() => setSelectedFolder(folder.id)}
            className={`flex items-center justify-between rounded-lg p-2 text-sm cursor-pointer border ${
              selectedFolderId === folder.id
                ? 'bg-amber-300 border-amber-600 text-amber-800 font-semibold'
                : 'border-transparent hover:bg-amber-100 hover:border-amber-400 hover:text-amber-700 font-medium'
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
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }}
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

      {folderToDelete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl border border-gray-200">
            <p className="text-center text-gray-900 font-semibold text-lg mb-4">
              {`Are you sure you want to delete \"${folderToDelete.name}\" board and all its notes?`}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDeleteFolder}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFolder}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 