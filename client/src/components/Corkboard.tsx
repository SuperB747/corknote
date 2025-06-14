import React, { useRef, useState } from 'react';
import { ArrowsRightLeftIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import useNoteStore from '../store/noteStore';
import Note from './Note';
import FirebaseUsageMonitor from './FirebaseUsageMonitor';
import { useAuth } from '../contexts/AuthContext';

// NOTE: adjust this to change maximum random rotation (degrees)
const MAX_ROTATION = 5;
// NOTE: must match NOTE_WIDTH and NOTE_HEIGHT in Note component
const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 200;

interface CorkboardProps {
  newNoteId?: string;
  onNewNoteHandled?: () => void;
}
const Corkboard: React.FC<CorkboardProps> = ({ newNoteId, onNewNoteHandled }) => {
  const { notes, folders, selectedFolderId, updateNotePosition, saveNotePositions, updateFolderSettings, updateNoteRotation, moveNoteToFolder, setSelectedFolder, loadNotes, isDragging: noteIsDragging } = useNoteStore();
  const { currentUser } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  // Layout save status
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // OCD toggle: when true, notes are not rotated
  const [ocdOn, setOcdOn] = useState(false);

  const folderNotes = (notes ?? []).filter(note => note.folderId === selectedFolderId);
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const boardName = currentFolder ? `${currentFolder.name} Board` : 'Board';
  const ocdEnabled = currentFolder?.ocdEnabled ?? false;

  // Shuffle notes within current scroll viewport bounds
  const shuffleNotes = () => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const viewX = container.scrollLeft;
    const viewY = container.scrollTop;
    folderNotes.forEach(note => {
      const x = viewX + Math.random() * Math.max(0, cw - NOTE_WIDTH);
      const y = viewY + Math.random() * Math.max(0, ch - NOTE_HEIGHT);
      updateNotePosition(note.id, { x, y });
      const angle = (Math.random() * 2 - 1) * MAX_ROTATION;
      updateNoteRotation(note.id, angle);
    });
  };

  // Save current layout (positions)
  const saveLayout = async () => {
    setSaving(true);
    try {
      await saveNotePositions();
      setSaved(true);
      if (newNoteId && onNewNoteHandled) onNewNoteHandled();
    } catch (error) {
      console.error('Failed to save layout', error);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // Update note position on drag end
  const handleDragEnd = (noteId: string, position: { x: number; y: number }) => {
    updateNotePosition(noteId, position);
  };

  return (
    // Outer wrapper: allow visible overflow for dragged notes
    <div className="absolute inset-0 overflow-visible overscroll-none">
      {/* Scrollable board container */}
      <div ref={containerRef} className="absolute inset-0 overflow-auto overscroll-none">
        {/* Compact floating toolbar */}
        <div className="no-drag fixed top-4 right-4 bg-white/70 backdrop-blur-md rounded-md px-4 py-2 shadow-md flex items-center space-x-2 z-50">
          <span className="text-sm font-medium">{`${boardName} (${folderNotes.length} notes)`}</span>
          <span className="text-gray-400">|</span>
          <label className="inline-flex items-center cursor-pointer">
            <SparklesIcon className="w-5 h-5 mr-1 text-current" />
            <span className="text-sm mr-1">Tidy Mode</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={ocdEnabled}
                onChange={() => updateFolderSettings(selectedFolderId as string, !ocdEnabled)}
                className="sr-only"
              />
              <div className={`w-8 h-4 rounded-full transition-colors ${ocdEnabled ? 'bg-[#7B61FF]' : 'bg-gray-300'}`}></div>
              <div className={`absolute top-0 left-0 w-4 h-4 bg-white rounded-full shadow transition-transform ${ocdEnabled ? 'translate-x-4' : ''}`}></div>
            </div>
          </label>
          <span className="text-gray-400">|</span>
          <button onClick={shuffleNotes} className="flex items-center gap-1 text-sm">
            <ArrowsRightLeftIcon className="w-5 h-5" />
            <span>Shuffle Notes</span>
          </button>
          <span className="text-gray-400">|</span>
          <button onClick={saveLayout} disabled={saving} className="flex items-center justify-center gap-1 text-sm min-w-[7rem]">
            <ArrowDownTrayIcon className="w-5 h-5" />
            <span>{saving ? 'Saving...' : saved ? 'Saved' : 'Save Layout'}</span>
          </button>
        </div>
        <div className="relative w-[150%] h-[150%] min-w-full min-h-full">
          {/* Corkboard background */}
          <div className="absolute inset-0 bg-cork bg-repeat"></div>
          <div className="absolute inset-0 bg-cork-overlay"></div>
          
          {/* Notes */}
          {folderNotes.map((note) => (
            <Note
              key={note.id}
              initialEditing={note.id === newNoteId}
              note={note}
              rotation={ocdEnabled ? 0 : note.rotation}
              onDragEnd={async (_, info) => {
                const newX = note.position.x + info.offset.x;
                const newY = note.position.y + info.offset.y;
                handleDragEnd(note.id, { x: newX, y: newY });
                // detect drop onto sidebar folder
                const sideEl = document.getElementById('sidebar');
                if (info.point && sideEl) {
                  const rect = sideEl.getBoundingClientRect();
                  if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
                    const newFolderId = (document.elementFromPoint(info.point.x, info.point.y) as HTMLElement)?.closest('[data-folder-id]')?.getAttribute('data-folder-id');
                    if (newFolderId && newFolderId !== selectedFolderId) {
                      const container = containerRef.current;
                      const viewX = container?.scrollLeft || 0;
                      const viewY = container?.scrollTop || 0;
                      const cw = container?.clientWidth || 0;
                      const ch = container?.clientHeight || 0;
                      const xRandom = viewX + Math.random() * Math.max(0, cw - NOTE_WIDTH);
                      const yRandom = viewY + Math.random() * Math.max(0, ch - NOTE_HEIGHT);
                      await moveNoteToFolder(note.id, newFolderId, { x: xRandom, y: yRandom });
                      setSelectedFolder(newFolderId);
                      // reload notes for new folder immediately
                      if (currentUser) {
                        loadNotes(currentUser.uid, newFolderId, true);
                      }
                    }
                  }
                }
              }}
              onNewNoteHandled={onNewNoteHandled}
            />
          ))}
        </div>
        {process.env.NODE_ENV === 'development' && <FirebaseUsageMonitor />}
      </div>
    </div>
  );
};

export default Corkboard; 