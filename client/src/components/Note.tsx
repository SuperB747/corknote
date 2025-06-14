import React, { useState, useEffect, useRef } from 'react';
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
  '#F9A8D4', // pink-300
  '#FB923C', // orange-400
  '#FCD34D', // yellow-300
  '#60A5FA', // blue-400
  '#34D399', // emerald-400
  '#5EEAD4', // cyan-300
  '#818CF8', // indigo-400
  '#A78BFA', // purple-400
  '#FF6B6B', // coral-400
  '#FDBA74', // amber-300
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
  rotation?: number;
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
  const [textSelecting, setTextSelecting] = useState(false);
  const [isOverSidebar, setIsOverSidebar] = useState(false);
  
  const prevSizeRef = useRef<'S'|'M'|'L'>(note.sizeCategory as 'S'|'M'|'L');
  const [selectedSize, setSelectedSize] = useState<'S'|'M'|'L'>(note.sizeCategory as 'S'|'M'|'L');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pinColor, setPinColor] = useState(pinColors[Math.floor(Math.random() * pinColors.length)]);
  const [pinKey, setPinKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

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

  const handleSave = () => {
    updateNoteSize(note.id, selectedSize);
    updateNote(note.id, { title, content, color });
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

  const handleInternalDragEnd = (event: any, info: any) => {
    setIsDragging(false);
    setDragging(false);
    setDisableHover(true);
    setIsOverSidebar(false);
    onDragEnd?.(event, info);
    setPinColor(pinColors[Math.floor(Math.random() * pinColors.length)]);
    setPinKey((k: number) => k + 1);
  };

  return (
    <motion.div
      onTap={() => removeHighlightNote(note.id)}
      initial={false}
      className={`note-draggable absolute rounded-2xl shadow-note overflow-hidden ${isHighlighted ? 'highlight-animate' : ''}`}
      onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => { e.stopPropagation(); }}
      onPointerDown={() => {
        setDisableHover(true);
        setIsHovered(false);
      }}
      onPointerEnter={() => {
        if (disableHover) setDisableHover(false);
      }}
      onHoverStart={() => {
        if (isHighlighted) removeHighlightNote(note.id);
        if (isEditing || disableHover || isDragging) return;
        setIsHovered(true);
      }}
      onPointerLeave={() => {
        setIsHovered(false);
        setTextSelecting(false);
      }}
      whileHover={disableHover || isEditing || isDragging ? undefined : { scale: 1.1, zIndex: 10000, transition: { duration: 0.1, ease: 'easeInOut' } }}
      whileDrag={isOverSidebar
        ? { scale: 0.8, opacity: 0.3 }
        : (disableHover || isDragging)
          ? { scale: 1, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }
          : { scale: 1.1, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
      style={{
        pointerEvents: isOverSidebar ? 'none' : 'auto',
        x: note.position.x,
        y: note.position.y,
        rotate: rotation,
        transformOrigin: 'center center',
        zIndex: (isDragging || isHighlighted || isHovered) ? 9999 : note.zIndex,
        backgroundColor: color,
        width: isEditing ? EDIT_MODE_WIDTH : SIZE_OPTIONS[selectedSize].width,
        height: isEditing ? EDIT_MODE_HEIGHT : SIZE_OPTIONS[selectedSize].height,
      }}
      animate={isHighlighted ? { scale: [0.8, 1] } : { scale: 1 }}
      transition={{ default: { duration: 0 }, scale: isHighlighted ? { duration: 0.15, repeat: 5, repeatType: 'reverse', ease: 'easeInOut' } : { duration: 0.1, ease: 'easeInOut' } }}
      onAnimationComplete={() => { if (isHighlighted) removeHighlightNote(note.id); }}
      drag={!textSelecting}
      dragRootElement={() => document.body}
      dragMomentum={false}
      onDragStart={(e: any, info: any) => {
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
          if (over !== isOverSidebar) {
            setIsOverSidebar(over);
          }
        }
      }}
      onDragEnd={handleInternalDragEnd}
    >
      {isHighlighted && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none border-4 border-yellow-300 animate-ping" style={{ zIndex: 10000 }} />
      )}
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
                className="w-full bg-transparent border-b border-gray-400 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => initialEditing && title === note.title && setTitle('')}
              />
              <div
                onPointerDown={(e) => { e.stopPropagation(); setTextSelecting(true); }}
                onPointerMove={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                className="mt-2 h-[400px] overflow-auto overscroll-none scrollbar-container"
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
          <div
            ref={contentRef}
            className={`mt-0 flex-1 relative text-sm scrollbar-container ${hasOverflow ? 'overflow-y-auto overscroll-none' : 'overflow-hidden'}`}
            onWheelCapture={(e: React.WheelEvent<HTMLDivElement>) => {
              if (hasOverflow && e.deltaY !== 0) {
                e.stopPropagation();
              }
            }}
          >
            <div
              className="quill-content-view"
              dangerouslySetInnerHTML={{ __html: content }}
            />
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
    </motion.div>
  );
};

export default NoteComponent;