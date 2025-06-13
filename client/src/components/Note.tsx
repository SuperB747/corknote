import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Note } from '../store/noteStore';
import useNoteStore from '../store/noteStore';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Ghibli style colors
const ghibliColors: string[] = [
  '#F9EDD0', // pale cream
  '#E9CFC6', // soft pink
  '#D68D6E', // terra cotta
  '#F4D06F', // mustard
  '#A3B18A', // sage green
  '#86C0B2', // sea green
  '#C5D5EA', // sky blue
  '#5C4D7D', // dark violet
  '#58595B', // muted grey
  '#B2A190', // beige grey
];

// NOTE: adjust these values (px) to change note sizes
const SIZE_OPTIONS = {
  S: { width: 200, height: 200 }, // Small
  M: { width: 300, height: 300 }, // Medium
  L: { width: 400, height: 400 }, // Large
};

// NOTE: adjust this constant to change editing mode width and height (e.g. set to 350 for 350px square)
const EDIT_MODE_SIZE = 350; // px for both width and height in editing mode

// quill toolbar config for advanced editing (bullets, lists, links)
const quillModules = {
  toolbar: [
    ['bold','italic','underline','strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean']
  ],
};
const quillFormats = [
  'bold','italic','underline','strike',
  'list','bullet',
  'link'
];

// Maximum random tilt for notes on save (degrees)
const MAX_ROTATION = 5;

// possible pin colors
const pinColors = ['#e53e3e', '#d69e2e', '#38a169', '#3182ce', '#805ad5', '#d53f8c'];

interface NoteProps {
  note: Note;
  rotation?: number;  // rotation angle in degrees
  initialEditing?: boolean;
  onNewNoteHandled?: () => void;
  onDragEnd?: (event: any, info: any) => void;
}

const NoteComponent: React.FC<NoteProps> = ({ note, rotation = 0, initialEditing = false, onDragEnd, onNewNoteHandled }) => {
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
  const [isOverSidebar, setIsOverSidebar] = useState(false);
  // S, M, L size selection
  const defaultSize = note.sizeCategory as 'S'|'M'|'L';
  const [selectedSize, setSelectedSize] = useState<'S'|'M'|'L'>(defaultSize);
  // store previous size to revert on cancel
  const prevSizeRef = useRef<'S'|'M'|'L'>(defaultSize);
  // delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // pin state: color and key to re-trigger animation
  const [pinColor, setPinColor] = useState(pinColors[Math.floor(Math.random() * pinColors.length)]);
  const [pinKey, setPinKey] = useState(0);
  // Ref & state for detecting overflow in view mode
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  // when entering edit mode, reset selectedSize to current note size
  useEffect(() => {
    if (isEditing) {
      setSelectedSize(note.sizeCategory as 'S'|'M'|'L');
      prevSizeRef.current = note.sizeCategory as 'S'|'M'|'L';
    }
  }, [isEditing, note.sizeCategory]);

  // Bring this note to front when editing
  useEffect(() => {
    if (isEditing) {
      updateNotePosition(note.id, note.position);
    }
  }, [isEditing]);

  // Disable hover effects when editing mode is enabled
  useEffect(() => {
    if (isEditing) {
      setIsHovered(false);
      setDisableHover(true);
    }
  }, [isEditing]);

  // if initialEditing prop becomes true, enter edit mode
  useEffect(() => {
    if (initialEditing) {
      setIsEditing(true);
      // clear content prompt for new note
      setContent('');
    }
  }, [initialEditing]);

  // new note random default color on initial edit mode
  useEffect(() => {
    if (initialEditing) {
      const randomColor = ghibliColors[Math.floor(Math.random() * ghibliColors.length)];
      setColor(randomColor);
    }
  }, [initialEditing]);

  useEffect(() => {
    const el = contentRef.current;
    if (el) {
      setHasOverflow(el.scrollHeight > el.clientHeight);
    }
  }, [note.content]);

  const handleSave = () => {
    // apply selected note size
    updateNoteSize(note.id, selectedSize);
    // persist title/content/color
    updateNote(note.id, { title, content, color });
    // if this was a newly created note, assign random rotation and notify parent
    if (initialEditing) {
      const angle = (Math.random() * 2 - 1) * MAX_ROTATION;
      updateNoteRotation(note.id, angle);
      onNewNoteHandled?.();
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    setDragging(false);
    onDragEnd?.(event, info);
    // re-pin: new color and re-trigger animation
    setPinColor(pinColors[Math.floor(Math.random() * pinColors.length)]);
    setPinKey((k: number) => k + 1);
  };

  return (
    <motion.div
      onTap={() => removeHighlightNote(note.id)}
      transition={{ default: { duration: 0 } }}
      initial={false}
      className="note-draggable absolute rounded-2xl shadow-note overflow-hidden"
      onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => { e.stopPropagation(); }}
      onHoverStart={() => {
        if (isEditing) return;
        if (disableHover) {
          setDisableHover(false);
        }
        setIsHovered(true);
      }}
      onHoverEnd={() => {
        setIsHovered(false);
      }}
      whileHover={disableHover || isEditing ? undefined : { scale: 1.15 }}
      whileDrag={isOverSidebar ? { scale: 0.8, opacity: 0.3 } : undefined}
      style={{
        pointerEvents: isOverSidebar ? 'none' : 'auto',
        x: note.position.x,
        y: note.position.y,
        rotate: rotation,
        transformOrigin: isOverSidebar ? 'center center' : 'center center',
        zIndex: isHovered ? 9999 : note.zIndex,
        backgroundColor: color,
        width: isEditing ? EDIT_MODE_SIZE : SIZE_OPTIONS[selectedSize].width,
        height: isEditing ? EDIT_MODE_SIZE : SIZE_OPTIONS[selectedSize].height,
      }}
      drag
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        setDragging(true);
        setDisableHover(true);
        setIsHovered(false);
        setIsOverSidebar(false);
        updateNotePosition(note.id, note.position);
      }}
      onDrag={(e: any, info: any) => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          const rect = sidebar.getBoundingClientRect();
          const over =
            info.point.x >= rect.left &&
            info.point.x <= rect.right &&
            info.point.y >= rect.top &&
            info.point.y <= rect.bottom;
          setIsOverSidebar(over);
        }
      }}
      onDragEnd={(e: any, info: any) => {
        setIsDragging(false);
        setDragging(false);
        setIsOverSidebar(false);
        onDragEnd?.(e, info);
        // After dragging, remain in view mode (don't enter editing)
      }}
    >
      {/* Highlight flash effect for new/moved notes */}
      {isHighlighted && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: [0.8, 0, 0.8] }}
          transition={{ duration: 1, repeat: 9, ease: 'easeInOut' }}
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', zIndex: 9999 }}
        />
      )}
      {/* Pin animation: hide while dragging, show on drop with random color */}
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

      {/* Content */}
      {isEditing ? (
        <>
          {/* Size selector overlay */}
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
          {/* Editor container: adjust 'h-full' to change overall editor height (e.g. use 'h-[500px]' for 500px height) */}
          <div className="flex flex-col h-full min-h-0">
            {/* Note editing inner padding: adjust 'min-h-0' to set minimum editor area height (e.g. 'min-h-[200px]') */}
            <div className="flex flex-col flex-1 p-1 overflow-hidden min-h-0">
              <input
                className="w-full bg-transparent border-b border-gray-400 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => initialEditing && title === note.title && setTitle('')}
              />
              {/* Editor scrollable area: adjust the h-[400px] below to change visible editor height (e.g. h-[400px] for 5 more lines) */}
              <div className="mt-2 h-[400px] overflow-auto overscroll-none scrollbar-container">
                {/* @ts-ignore */}
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
              {ghibliColors.map((hex, idx) => (
                <button
                  key={idx}
                  className={`w-6 h-6 rounded-full border ${color === hex ? 'border-black' : 'border-gray-300'}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => setColor(hex)}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2 py-1 px-4">
              <button
                className="px-2 py-1 text-sm"
                onClick={() => {
                  if (initialEditing) {
                    deleteNote(note.id);
                    if (onNewNoteHandled) onNewNoteHandled();
                  } else {
                    setIsEditing(false);
                    setSelectedSize(prevSizeRef.current);
                    setTitle(note.title);
                    setContent(note.content);
                    setColor(note.color);
                  }
                }}
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
          {/* Header: title and action buttons */}
          <div className="mt-3 mb-1 flex justify-between items-start shrink-0">
            <h3 className="font-medium text-lg truncate">{note.title}</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(true)} className="p-1 hover:bg-black/10 rounded">
                <PencilIcon className="w-4 h-4" />
              </button>
              <button onClick={handleDelete} className="p-1 hover:bg-black/10 rounded">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Content area: truncated until hover, scroll on hover */}
          <div
            ref={contentRef}
            className={`mt-0 flex-1 relative text-sm scrollbar-container ${hasOverflow ? 'overflow-y-auto overscroll-none' : 'overflow-hidden'}`}
            onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => {
              // Only intercept vertical scroll when content is overflowed, so note content scrolls
              if (hasOverflow && e.deltaY !== 0) {
                e.stopPropagation();
              }
              // Horizontal scroll events will propagate to enable board panning
            }}
          >
            <div className="ql-snow p-0">
              <div
                className="ql-editor p-0 [&_ul]:pl-2 [&_ol]:pl-2 [&_ul]:!mt-0 [&_ol]:!mt-0 [&_ul]:!mb-0 [&_ol]:!mb-0 [&_ul]:list-outside [&_ol]:list-outside"
                style={{ margin: 0, padding: 0 }}
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          </div>
          {/* Ellipsis indicator for truncated content */}
          {hasOverflow && (
            <div className="absolute bottom-1 right-2 text-gray-400 pointer-events-none">
              ...
            </div>
          )}
        </div>
      )}
      {/* delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-amber-100 p-6 rounded-xl border-2 border-amber-300 shadow-2xl max-w-xs text-center">
            <h3 className="text-xl text-amber-800 mb-3">🍂 Confirm Delete Note</h3>
            <p className="text-amber-700 mb-4">Are you sure you want to delete this note?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-amber-200 hover:bg-amber-300 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteNote(note.id); setShowDeleteConfirm(false); }}
                className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-full"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NoteComponent; 