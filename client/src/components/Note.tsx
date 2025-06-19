import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Note } from '../store/noteStore';
import useNoteStore from '../store/noteStore';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Ghibli-style pastel & bright color palettes
const pastelColors: string[] = [
  '#FCE7F3', // pink-100
  '#FFEDD5', // orange-100
  '#FEF3C7', // amber-100
  '#FDFFE0', // yellow-50
  '#D1FAE5', // emerald-100
  '#D1FAFC', // cyan-100
  '#DBEAFE', // blue-100
  '#E0E7FF', // indigo-100
  '#EDE9FE', // purple-100
  '#FDF2F8', // rose-100
];
const deepColors: string[] = [
  '#FDFFB6', // Greenish
  '#CAFFBF', // Yellowish
  '#A0C4FF', // Neon Blue
  '#9BF6FF', // Neon Purple
  '#A3D9C5', // aquamarine
  '#52B2CF', // sky teal
  '#8ECAE6', // light sky blue
  '#F7B2AD', // pink peach
  '#FFC6FF', // mauve
  '#BDB2FF', // lavender
];
const allColors = [...pastelColors, ...deepColors];

// NOTE: adjust these values (px) to change note sizes
const SIZE_OPTIONS = {
  S: { width: 200, height: 200 }, // Small
  M: { width: 300, height: 300 }, // Medium
  L: { width: 400, height: 400 }, // Large
};

// NOTE: adjust these constants to change editing mode dimensions
const EDIT_MODE_WIDTH = 350; // px for width in editing mode
const EDIT_MODE_HEIGHT = 360; // px for height in editing mode

// quill toolbar config for advanced editing (bullets, lists, links, checklists)
const quillModules = {
  toolbar: [
    ['bold','italic','underline','strike'],
    [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ['link'],
    ['clean']
  ],
};
const quillFormats = [
  'bold','italic','underline','strike',
  'list','bullet','check',
  'link'
];

// Maximum random tilt for notes on save (degrees)
const MAX_ROTATION = 5;

// possible pin colors
const pinColors = ['#e53e3e', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c'];

interface NoteProps {
  note: Note;
  rotation?: number;
  initialEditing?: boolean;
  onNewNoteHandled?: () => void;
  onDragEnd?: (event: any, info: any) => void;
  /** Optional ref to constrain drag (canvas container) */
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
  highlightColor?: string;
  highlightWidth?: number;
  /** Opacity for the highlight border (0 to 1) */
  highlightOpacity?: number;
}

function NoteComponent({ note, rotation = 0, initialEditing = false, onDragEnd, onNewNoteHandled, dragConstraints,
  highlightColor = '#8B0000',
  highlightWidth = 4,
  highlightOpacity = 1,
}: NoteProps): React.ReactElement {
  const { updateNote, deleteNote, updateNotePosition, updateNoteSize, updateNoteRotation } = useNoteStore();
  const setDragging = useNoteStore(state => state.setDragging);
  const highlightedNoteIds = useNoteStore(state => state.highlightedNoteIds);
  const isHighlighted = highlightedNoteIds.includes(note.id);
  const removeHighlightNote = useNoteStore(state => state.removeHighlightNote);
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color || '#fff7c0');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [disableHover, setDisableHover] = useState(false);
  const [textSelecting, setTextSelecting] = useState(false);
  const [isOverSidebar, setIsOverSidebar] = useState(false);
  
  const prevSizeRef = useRef<'S'|'M'|'L'>(note.sizeCategory as 'S'|'M'|'L');
  const prevPosRef = useRef<{x:number,y:number}>(note.position);
  const [selectedSize, setSelectedSize] = useState<'S'|'M'|'L'>(note.sizeCategory as 'S'|'M'|'L');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pinColor, setPinColor] = useState(pinColors[Math.floor(Math.random() * pinColors.length)]);
  const [pinKey, setPinKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const dynamicShadow = '0 4px 8px rgba(0,0,0,0.6)';
  // calculate checklist completion percentage
  const checklistPercent = useMemo<number|null>(() => {
    const div = document.createElement('div');
    div.innerHTML = content;
    const items = div.querySelectorAll('li.ql-checklist');
    if (items.length === 0) return null;
    const checked = div.querySelectorAll('li.ql-checklist.ql-checked').length;
    return Math.round((checked / items.length) * 100);
  }, [content]);

  useEffect(() => {
    if (isEditing) {
      setSelectedSize(note.sizeCategory as 'S'|'M'|'L');
      prevSizeRef.current = note.sizeCategory as 'S'|'M'|'L';
    }
  }, [isEditing, note.sizeCategory]);

  useEffect(() => {
    if (isEditing) {
      updateNotePosition(note.id, note.position);
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditing) {
      setIsHovered(false);
      setDisableHover(true);
    }
  }, [isEditing]);

  useEffect(() => {
    if (initialEditing) {
      setIsEditing(true);
      setContent('');
    }
  }, [initialEditing]);

  useEffect(() => {
    if (initialEditing) {
      const randomColor = allColors[Math.floor(Math.random() * allColors.length)];
      setColor(randomColor);
    }
  }, [initialEditing]);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setHasOverflow(el.scrollHeight > el.clientHeight);
    }
  }, [note.content]);

  useEffect(() => {
    if (isEditing) {
      prevPosRef.current = note.position;
    }
  }, [isEditing, note.position]);

  // Convert hex color to rgba string with given alpha
  const hexToRgba = (hex: string, alpha: number) => {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('#')) {
      const h = hex.slice(1);
      if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
      } else if (h.length === 6) {
        r = parseInt(h.slice(0,2), 16);
        g = parseInt(h.slice(2,4), 16);
        b = parseInt(h.slice(4,6), 16);
      }
    }
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const handleSave = () => {
    updateNoteSize(note.id, selectedSize);
    updateNote(note.id, { title, content, color });
    if (initialEditing) {
      const angle = (Math.random() * 2 - 1) * MAX_ROTATION;
      updateNoteRotation(note.id, angle);
      onNewNoteHandled?.();
    }
    updateNotePosition(note.id, prevPosRef.current);
    setIsEditing(false);
    setTextSelecting(false);
  };

  const handleCancel = () => {
    if (initialEditing) {
      // remove new note if cancelling creation
      deleteNote(note.id);
      onNewNoteHandled?.();
      return;
    }
    // revert state and restore position
    updateNotePosition(note.id, prevPosRef.current);
    setIsEditing(false);
    setTextSelecting(false);
    setSelectedSize(prevSizeRef.current);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleInternalDragEnd = () => {
    // Called after manual drag completes
    setIsDragging(false);
    setDragging(false);
    setDisableHover(true);
    setIsOverSidebar(false);
    // Keep pin handling unchanged
    setPinColor(pinColors[Math.floor(Math.random() * pinColors.length)]);
    setPinKey((k: number) => k + 1);
  };

  // Manual drag state
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    e.preventDefault();
    dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, origX: note.position.x, origY: note.position.y };
    setIsDragging(true);
    setDragging(true);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };
  const handlePointerMove = (e: PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    updateNotePosition(note.id, { x: dragState.current.origX + dx, y: dragState.current.origY + dy });
  };
  const handlePointerUp = () => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
    handleInternalDragEnd();
  };

  return (
    <div
      className="note-draggable"
      onClick={() => removeHighlightNote(note.id)}
      onPointerDown={handlePointerDown}
      onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: note.position.y,
        left: note.position.x,
        width: isEditing ? EDIT_MODE_WIDTH : SIZE_OPTIONS[selectedSize].width,
        height: isEditing ? EDIT_MODE_HEIGHT : SIZE_OPTIONS[selectedSize].height,
        backgroundColor: color,
        boxShadow: isHighlighted ? `${dynamicShadow}, inset 0 0 0 ${highlightWidth}px ${hexToRgba(highlightColor, highlightOpacity)}` : dynamicShadow,
        transform: `rotate(${rotation}deg) scale(${isHighlighted ? 1.1 : 1})`,
        transformOrigin: 'center center',
        zIndex: (isDragging || isHighlighted) ? 9999 : note.zIndex,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      {!isDragging && (
        <motion.div
          key={pinKey}
          className="absolute top-0 left-1/2 -translate-x-1/2"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        >
          <MapPinIcon className="w-6 h-6" style={{ color: pinColor }} />
        </motion.div>
      )}
      {isEditing ? (
        <>
          <div className="absolute top-2 right-2 flex items-center gap-2 bg-transparent p-1 rounded">
            {(['S','M','L'] as const).map(key => (
              <label key={key} className="inline-flex items-center gap-1 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="size"
                  value={key}
                  checked={selectedSize===key}
                  onChange={() => setSelectedSize(key)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 border-2 rounded-full flex items-center justify-center ${selectedSize===key ? 'border-black' : 'border-gray-300'}`}>
                  {selectedSize===key && <div className="w-2 h-2 bg-black rounded-full" />}
                </div>
                <span className="text-xs">{key}</span>
              </label>
            ))}
          </div>
          <div className="flex flex-col h-[360px] min-h-0">
            <div className="flex flex-col flex-1 p-1 overflow-hidden min-h-0">
              <input
                onPointerDown={(e) => { e.stopPropagation(); setTextSelecting(true); }}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="w-full bg-transparent border-b border-gray-400 focus:outline-none cursor-text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => initialEditing && title === note.title && setTitle('')}
              />
              <div
                onPointerDown={(e) => { e.stopPropagation(); setTextSelecting(true); }}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="mt-2 h-[400px] overflow-auto overscroll-none scrollbar-container cursor-text"
              >
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                />
              </div>
            </div>
            <div className="flex justify-center flex-wrap gap-1 py-1">
              {pastelColors.map((hex, idx) => (
                <button
                  key={`pastel-${idx}`}
                  className={`w-6 h-6 rounded-full border ${color === hex ? 'border-black' : 'border-gray-300'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>
            <div className="flex justify-center flex-wrap gap-1 pb-1">
              {deepColors.map((hex, idx) => (
                <button
                  key={`deep-${idx}`}
                  className={`w-6 h-6 rounded-full border ${color === hex ? 'border-black' : 'border-gray-300'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 py-1 px-4">
              <button
                className="px-2 py-1 text-sm"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="px-2 py-1 text-sm text-blue-600"
                onClick={() => {
                  prevSizeRef.current = selectedSize;
                  handleSave();
                }}
              >
                Save
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="p-2 flex flex-col h-full relative">
          <div className="mt-3 mb-1 flex justify-between items-start shrink-0">
            <h3 className="font-medium text-lg truncate">{note.title}</h3>
            <div className="flex gap-2">
              <button onPointerDown={(e) => e.stopPropagation()} onClick={() => setIsEditing(true)} className="p-1 hover:bg-black/10 rounded">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button onPointerDown={(e) => e.stopPropagation()} onClick={handleDelete} className="p-1 hover:bg-black/10 rounded">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={contentRef}
            className={`mt-0 flex-1 relative text-sm scrollbar-container ${hasOverflow ? 'overflow-y-auto overscroll-none' : 'overflow-hidden'}`}
            onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => {
              if (hasOverflow && e.deltaY !== 0) {
                e.stopPropagation();
              }
            }}
          >
            <div className="ql-snow p-0">
              <div
                className="ql-editor p-0"
                style={{ margin: 0, padding: 0 }}
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
          {hasOverflow && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/50 backdrop-blur-sm px-1 rounded">
              scroll
            </div>
          )}
        </div>
      )}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <p className="font-semibold mb-2">Delete this note?</p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                deleteNote(note.id);
                setShowDeleteConfirm(false);
              }}
              className="px-3 py-1 bg-red-500 text-white rounded-md"
            >
              Delete
            </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-gray-200 rounded-md"
              >
                Cancel
              </button>
          </div>
        </div>
      )}
      {/* Checklist completion overlay */}
      {!isEditing && checklistPercent !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className="text-gray-800 text-4xl font-bold opacity-30">{checklistPercent}%</span>
        </div>
      )}
    </div>
  );
}

export default NoteComponent; 