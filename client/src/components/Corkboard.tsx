import React, { useRef, useState, useEffect } from 'react';
import { ArrowsRightLeftIcon, ArrowDownTrayIcon, SparklesIcon } from '@heroicons/react/24/outline';
import useNoteStore from '../store/noteStore';
import Note from './Note';
import type { Note as NoteType } from '../store/noteStore';
import FirebaseUsageMonitor from './FirebaseUsageMonitor';
import { useAuth } from '../contexts/AuthContext';

// NOTE: adjust this to change maximum random rotation (degrees)
const MAX_ROTATION = 5;
// NOTE: must match NOTE_WIDTH and NOTE_HEIGHT in Note component
const NOTE_WIDTH = 200;
const NOTE_HEIGHT = 200;

// Board dimensions: adjust to control scrollable canvas size
const BOARD_WIDTH = 2000; // px: horizontal scrollable width (adjust as needed)
const BOARD_HEIGHT = 1500; // px: vertical scrollable height (adjust as needed)

interface CorkboardProps {
  newNoteId?: string;
  onNewNoteHandled?: () => void;
}
const Corkboard: React.FC<CorkboardProps> = ({ newNoteId, onNewNoteHandled }) => {
  const { notes, folders, selectedFolderId, updateNotePosition, saveNotePositions, updateFolderSettings, updateNoteRotation, moveNoteToFolder, setSelectedFolder, loadNotes, addHighlightNote, isDragging: noteIsDragging } = useNoteStore();
  const { currentUser } = useAuth();
  // Transitional state when moving a note between folders
  const [isMovingFolder, setIsMovingFolder] = useState(false);
  const [transitionNotes, setTransitionNotes] = useState<NoteType[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  // Setup grab-to-pan behavior for corkboard
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let isPanning = false;
    let startX = 0, startY = 0, startScrollLeft = 0, startScrollTop = 0;
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // don't pan when interacting with a note
      const target = e.target as HTMLElement;
      if (target.closest('.note-draggable')) return;
      isPanning = true;
      startX = e.clientX;
      startY = e.clientY;
      startScrollLeft = el.scrollLeft;
      startScrollTop = el.scrollTop;
      el.style.cursor = 'grabbing';
      e.preventDefault();
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.scrollLeft = startScrollLeft - dx;
      el.scrollTop = startScrollTop - dy;
    };
    const onMouseUp = () => {
      if (!isPanning) return;
      isPanning = false;
      el.style.cursor = 'grab';
    };
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    // initial cursor
    el.style.cursor = 'grab';
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Layout save status
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // OCD toggle: when true, notes are not rotated
  const [ocdOn, setOcdOn] = useState(false);

  const folderNotes = (notes ?? []).filter(note => note.folderId === selectedFolderId);
  // Decide which notes to render: either in-transition old folder view or current folder view
  const notesToRender = isMovingFolder && transitionNotes.length > 0 ? transitionNotes : folderNotes;
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const boardName = currentFolder ? `${currentFolder.name} Board` : 'Board';
  const ocdEnabled = currentFolder?.ocdEnabled ?? false;

  // Shuffle notes: randomize positions without overlap and keep within bounds
  const shuffleNotes = () => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const vx = container.scrollLeft;
    const vy = container.scrollTop;
    if (!selectedFolderId) return;
    const notesToShuffle = notes.filter(n => n.folderId === selectedFolderId);
    console.log('Shuffling notes:', notesToShuffle.map(n => n.id));
    // track placed note rectangles
    const placedRects: { x: number; y: number }[] = [];
    notesToShuffle.forEach(note => {
      let x: number, y: number;
      const maxAttempts = 100;
      let attempts = 0;
      // find a non-overlapping position
      do {
        x = vx + Math.random() * Math.max(0, cw - NOTE_WIDTH);
        y = vy + Math.random() * Math.max(0, ch - NOTE_HEIGHT);
        attempts++;
      } while (
        attempts < maxAttempts &&
        placedRects.some(r =>
          x < r.x + NOTE_WIDTH &&
          x + NOTE_WIDTH > r.x &&
          y < r.y + NOTE_HEIGHT &&
          y + NOTE_HEIGHT > r.y
        )
      );
      // record the placed position
      placedRects.push({ x, y });
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

  // Expose saveLayout globally for external triggers (e.g., sidebar)
  useEffect(() => {
    (window as any).saveLayout = saveLayout;
    return () => { delete (window as any).saveLayout; };
  }, [saveLayout, newNoteId, onNewNoteHandled]);

  // Update note position on drag end
  const handleDragEnd = (noteId: string, position: { x: number; y: number }) => {
    updateNotePosition(noteId, position);
  };

  return (
    // Outer wrapper: establish positioning context for the scrollable area
    <div className="absolute inset-0 overscroll-none">
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

      {/* 
        Scrollable board container. This single element handles both scrolling 
        and provides the large area for notes. Its parent has position:absolute 
        to ensure this container fills the layout correctly without creating a 
        new stacking context that would trap the dragged notes.
      */}
      <div
        ref={containerRef}
        id="corkboard-container"
        className="absolute inset-0 overflow-auto overscroll-none w-full h-full scrollbar-container cursor-grab"
      >
        {/* Canvas area: adjustable via BOARD_WIDTH and BOARD_HEIGHT constants above */}
        <div ref={canvasRef} className="relative overflow-hidden" style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}>
          {/* Corkboard background */}
          <div className="absolute inset-0 bg-cork bg-repeat"></div>
          <div className="absolute inset-0 bg-cork-overlay"></div>
          
          {/* Notes */}
          {notesToRender.map((note) => (
            <Note
              key={note.id}
              dragConstraints={canvasRef}
              initialEditing={note.id === newNoteId}
              note={note}
              rotation={ocdEnabled ? 0 : note.rotation}
              onDragEnd={async (event, info) => {
                // Clamp and update note position within board bounds
                const rawX = note.position.x + info.offset.x;
                const rawY = note.position.y + info.offset.y;
                const clampedX = Math.max(0, Math.min(rawX, BOARD_WIDTH - NOTE_WIDTH));
                const clampedY = Math.max(0, Math.min(rawY, BOARD_HEIGHT - NOTE_HEIGHT));
                const newPosition = { x: clampedX, y: clampedY };
                await (async () => newPosition)();
                // Check for folder drop
                let droppedOnFolder = false;
                const sideEl = document.getElementById('sidebar');
                if (info.point && sideEl) {
                  const rect = sideEl.getBoundingClientRect();
                  if (info.point.x >= rect.left && info.point.x <= rect.right && info.point.y >= rect.top && info.point.y <= rect.bottom) {
                    const newFolderId = (document.elementFromPoint(info.point.x, info.point.y) as HTMLElement)
                      .closest('[data-folder-id]')
                      ?.getAttribute('data-folder-id');
                    if (newFolderId && newFolderId !== selectedFolderId) {
                      droppedOnFolder = true;
                      // Prepare transition: keep other notes visible until new folder loads
                      setTransitionNotes(folderNotes.filter(n => n.id !== note.id));
                      setIsMovingFolder(true);
                      const container = containerRef.current;
                      const viewX = container?.scrollLeft || 0;
                      const viewY = container?.scrollTop || 0;
                      const cw = container?.clientWidth || 0;
                      const ch = container?.clientHeight || 0;
                      const xRandom = viewX + Math.random() * Math.max(0, cw - NOTE_WIDTH);
                      const yRandom = viewY + Math.random() * Math.max(0, ch - NOTE_HEIGHT);
                      await moveNoteToFolder(note.id, newFolderId, { x: xRandom, y: yRandom });
                      // Load new folder notes and switch view (position comes from Firestore)
                      if (currentUser) {
                        await loadNotes(currentUser.uid, newFolderId, true);
                      }
                      addHighlightNote(note.id);
                      setSelectedFolder(newFolderId);
                      setIsMovingFolder(false);
                    }
                  }
                }
                if (!droppedOnFolder) {
                  updateNotePosition(note.id, newPosition);
                }
              }}
              onNewNoteHandled={onNewNoteHandled}
            />
          ))}
        </div>
      </div>
      {process.env.NODE_ENV === 'development' && <FirebaseUsageMonitor />}
    </div>
  );
};

export default Corkboard; 