import React, { useRef, useEffect, useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import useNoteStore from '../store/noteStore';
import Note from './Note';
import FirebaseUsageMonitor from './FirebaseUsageMonitor';

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
  const { notes, folders, selectedFolderId, updateNotePosition, saveNotePositions, updateFolderSettings, updateNoteRotation } = useNoteStore();
  const corkboardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Grid Mode toggle state (UI only)
  const [gridMode, setGridMode] = useState(false);
  // Grid configuration (adjustable):
  const GRID_SPACING = 20; // px gap between notes
  const GRID_MARGIN_TOP = 20; // px top margin for first row
  const [gridPositions, setGridPositions] = useState<Record<string,{x:number,y:number}>>({});
  // Auto Align toggle UI (no logic yet)
  const [autoAlign, setAutoAlign] = useState(false);

  // Reset pan position when switching boards
  useEffect(() => {
    setViewportPosition({ x: 0, y: 0 });
  }, [selectedFolderId]);

  const [viewportPosition, setViewportPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  // Layout save status
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // OCD toggle: when true, notes are not rotated
  const [ocdOn, setOcdOn] = useState(false);

  const folderNotes = notes.filter(note => note.folderId === selectedFolderId);
  const currentFolder = folders.find(f => f.id === selectedFolderId);
  const boardName = currentFolder ? `${currentFolder.name} Board` : 'Board';
  const ocdEnabled = currentFolder?.ocdEnabled ?? false;

  // Clamp viewport position within board bounds
  const clampPosition = (x: number, y: number) => {
    const maxX = boardSize.width - containerSize.width;
    const maxY = boardSize.height - containerSize.height;
    
    return {
      x: Math.min(0, Math.max(-maxX, x)),
      y: Math.min(0, Math.max(-maxY, y))
    };
  };

  // Update board and container dimensions
  useEffect(() => {
    const updateSizes = () => {
      if (corkboardRef.current && containerRef.current) {
        const board = corkboardRef.current.firstChild as HTMLElement;
        setBoardSize({
          width: board.offsetWidth,
          height: board.offsetHeight
        });
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSizes();
    window.addEventListener('resize', updateSizes);
    return () => window.removeEventListener('resize', updateSizes);
  }, []);

  // Compute grid positions when gridMode toggles or container width/notes change
  useEffect(() => {
    if (!gridMode) return;
    const cols = Math.max(1, Math.floor((containerSize.width - GRID_SPACING) / (NOTE_WIDTH + GRID_SPACING)));
    const newPositions: Record<string,{x:number,y:number}> = {};
    folderNotes.forEach((note, idx) => {
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const x = col * (NOTE_WIDTH + GRID_SPACING) + GRID_SPACING;
      const y = row * (NOTE_HEIGHT + GRID_SPACING) + GRID_MARGIN_TOP;
      newPositions[note.id] = { x, y };
    });
    setGridPositions(newPositions);
  }, [gridMode, containerSize.width, folderNotes]);

  // Save current layout (positions)
  const saveLayout = async () => {
    setSaving(true);
    try {
      await saveNotePositions();
      setSaved(true);
      // clear new note state if layout save covers pending new note
      if (newNoteId && onNewNoteHandled) onNewNoteHandled();
    } catch (error) {
      console.error('Failed to save layout', error);
    } finally {
      setSaving(false);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleDragEnd = (noteId: string, position: { x: number; y: number }) => {
    // Clamp so note stays within board bounds
    const clampedX = Math.min(boardSize.width - NOTE_WIDTH, Math.max(0, position.x));
    const clampedY = Math.min(boardSize.height - NOTE_HEIGHT, Math.max(0, position.y));
    updateNotePosition(noteId, { x: clampedX, y: clampedY });
  };

  useEffect(() => {
    const corkboard = corkboardRef.current;
    if (!corkboard) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const newPosition = {
        x: viewportPosition.x - e.deltaX,
        y: viewportPosition.y - e.deltaY
      };
      
      setViewportPosition(clampPosition(newPosition.x, newPosition.y));
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.note-draggable') || (e.target as HTMLElement).closest('.no-drag')) return;
      
      setIsDragging(true);
      setDragStart({
        x: e.clientX - viewportPosition.x,
        y: e.clientY - viewportPosition.y
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const newPosition = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      };
      
      setViewportPosition(clampPosition(newPosition.x, newPosition.y));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    corkboard.addEventListener('wheel', handleWheel, { passive: false });
    corkboard.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      corkboard.removeEventListener('wheel', handleWheel);
      corkboard.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, viewportPosition, boardSize, containerSize]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
    >
      {/* Compact floating toolbar */}
      <div className="no-drag absolute top-4 right-4 bg-white/70 backdrop-blur-md rounded-md px-4 py-2 shadow-md flex items-center space-x-2 z-50">
        <span className="text-sm font-medium">{`${boardName} (${folderNotes.length} notes)`}</span>
        <span className="text-gray-400">|</span>
        <label className="inline-flex items-center cursor-pointer">
          <span className="text-sm mr-1">OCD</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={ocdEnabled}
              onChange={() => updateFolderSettings(selectedFolderId as string, !ocdEnabled)}
              className="sr-only"
            />
            <div className="w-8 h-4 bg-gray-300 rounded-full"></div>
            <div className={`absolute top-0 left-0 w-4 h-4 bg-white rounded-full shadow transform transition ${ocdEnabled ? 'translate-x-4' : ''}`}></div>
          </div>
        </label>
        <span className="text-gray-400">|</span>
        <label className="inline-flex items-center cursor-pointer">
          <span className="text-sm mr-1">Auto Align</span>
          <div className="relative">
            <input
              type="checkbox"
              checked={autoAlign}
              onChange={() => setAutoAlign(!autoAlign)}
              className="sr-only"
            />
            <div className="w-8 h-4 bg-gray-300 rounded-full"></div>
            <div className={`absolute top-0 left-0 w-4 h-4 bg-white rounded-full shadow transform transition ${autoAlign ? 'translate-x-4' : ''}`}></div>
          </div>
        </label>
        <span className="text-gray-400">|</span>
        <button onClick={saveLayout} disabled={saving} className="flex items-center justify-center gap-1 text-sm min-w-[7rem]">
          <ArrowDownTrayIcon className="w-5 h-5" />
          <span>{saving ? 'Saving...' : saved ? 'Saved' : 'Save Layout'}</span>
        </button>
      </div>
      <div
        ref={corkboardRef}
        className="absolute inset-0"
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      >
        <div 
          className="absolute"
          style={{
            transform: `translate(${viewportPosition.x}px, ${viewportPosition.y}px)`,
            width: '150%',
            height: '150%',
            minWidth: '100vw',
            minHeight: '100vh'
          }}
        >
          {/* Corkboard background */}
          <div className="absolute inset-0 bg-cork bg-repeat"></div>
          <div className="absolute inset-0 bg-cork-overlay"></div>
          
          {/* Notes */}
          {folderNotes.map(note => (
            <Note
              key={note.id}
              initialEditing={note.id === newNoteId}
              note={note}
              rotation={ocdEnabled ? 0 : note.rotation}
              onDragEnd={(_, info) => {
                const newX = note.position.x + info.offset.x;
                const newY = note.position.y + info.offset.y;
                handleDragEnd(note.id, { x: newX, y: newY });
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