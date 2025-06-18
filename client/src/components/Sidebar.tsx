import React, { useState } from 'react';
import Modal from './Modal';
// @ts-ignore
import { motion, Reorder } from 'framer-motion';
import useNoteStore from '../store/noteStore';
import { useAuth } from '../contexts/AuthContext';
import { FolderIcon, PlusIcon, PencilIcon, TrashIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { UserProfile } from './UserProfile';
import { getNotes } from '../services/noteService';

const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { folders, selectedFolderId, setSelectedFolder, createFolder, updateFolder, deleteFolder, reorderFolders, isDragging } = useNoteStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isEditingFolder, setIsEditingFolder] = useState<string | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderToDelete, setFolderToDelete] = useState<{id: string; name: string} | null>(null);
  const [cannotDeleteModal, setCannotDeleteModal] = useState<{name: string; count: number} | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);

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

  const handleDeleteFolder = async (folder: { id: string; name: string }) => {
    if (!currentUser) return;
    try {
      // Check if folder has any notes
      const notes = await getNotes(currentUser.uid, folder.id);
      if (notes.length > 0) {
        setCannotDeleteModal({ name: folder.name, count: notes.length });
        return;
      }
    } catch (err) {
      console.error('Error checking folder contents:', err);
      return;
    }
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

  // Handler to auto-save layout changes before selecting a new folder
  const handleSelectFolder = async (folderId: string) => {
    // Simulate Save Layout button click if available
    if (typeof (window as any).saveLayout === 'function') {
      await (window as any).saveLayout();
    }
    setSelectedFolder(folderId);
  };

  return (
    <div id="sidebar" className="fixed top-0 left-0 bottom-0 z-20 w-64 bg-amber-50 border-r border-amber-200 p-4 flex flex-col overflow-y-auto">
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
            className="flex-1 min-w-0 px-2 py-2 border rounded-md"
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <CheckIcon className="w-4 h-4 text-amber-600" />
          </button>
          <button
            onClick={() => { setIsCreatingFolder(false); setFolderName(''); }}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      )}

      <Reorder.Group initial={false} axis="y" values={folders} onReorder={reorderFolders} className="space-y-2 flex-1 overflow-y-auto overscroll-none scrollbar-container">
        {folders.map((folder) => (
          <Reorder.Item
            initial={false}
            key={folder.id}
            data-folder-id={folder.id}
            value={folder}
            onClick={() => handleSelectFolder(folder.id)}
            dragListener={!isDragging}
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
                  onClick={(e) => { e.stopPropagation(); handleSelectFolder(folder.id); }}
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

      {/* Footer card */}
      <div className="mt-4 p-3 bg-amber-200 rounded-lg text-amber-800 text-xs border border-amber-300 shadow-md">
        <div className="flex justify-between">
          <button onClick={() => setIsContactOpen(true)} className="hover:underline">Contact Us</button>
          <span>© {new Date().getFullYear()} CorkNote</span>
        </div>
      </div>

      {/* Contact Modal */}
      <Modal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} title="Contact Us">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Email</label>
            <input type="email" className="mt-1 block w-full px-2 py-1 border rounded-md" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Message</label>
            <textarea className="mt-1 block w-full px-2 py-1 border rounded-md h-24" placeholder="Write your message..." />
          </div>
          <div className="text-right">
            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Send</button>
          </div>
        </form>
      </Modal>

      {cannotDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-amber-100 p-6 rounded-xl border-2 border-amber-300 shadow-2xl max-w-xs text-center">
            <h3 className="text-xl text-amber-800 mb-3">Oops! 🍂</h3>
            <p className="text-amber-700 mb-4">"{cannotDeleteModal.name}" board contains {cannotDeleteModal.count} note(s).<br/>Please delete all notes first.</p>
            <button
              onClick={() => setCannotDeleteModal(null)}
              className="px-4 py-2 bg-amber-600 text-white rounded-full hover:bg-amber-700"
            >Got it!</button>
          </div>
        </div>
      )}
      {folderToDelete && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-amber-100 p-6 rounded-xl border-2 border-amber-300 shadow-2xl max-w-xs text-center">
            <h3 className="text-xl text-amber-800 mb-3">🍂 Confirm Deletion</h3>
            <p className="text-amber-700 mb-4">"{folderToDelete.name}" board contains no notes and will be deleted.</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={cancelDeleteFolder}
                className="px-4 py-2 bg-amber-200 hover:bg-amber-300 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteFolder}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-full"
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