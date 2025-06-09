import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Note } from '../store/noteStore';
import useNoteStore from '../store/noteStore';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { MapPinIcon } from '@heroicons/react/24/solid';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// 형광색 포스트잇 색상 (hex codes)
const neonColors: Record<string, string> = {
  yellow: '#ffff00',
  green: '#00ff00',
  pink: '#ff69b4',
  orange: '#ff8c00',
  blue: '#00ffff',
};

// 파스텔 포스트잇 색상 (hex codes)
const pastelColors: Record<string, string> = {
  yellow: '#fff7c0',
  green: '#c8f7c5',
  pink: '#ffcfe0',
  blue: '#c5e7f7',
  purple: '#e7c5f7',
};

// NOTE: adjust these values (px) to change note sizes
const SIZE_OPTIONS = {
  S: { width: 200, height: 200 }, // Small
  M: { width: 300, height: 300 }, // Medium
  L: { width: 400, height: 400 }, // Large
};

// NOTE: adjust this to change editing mode size
const EDIT_MODE_SIZE = 350; // px

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
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

const NoteComponent: React.FC<NoteProps> = ({ note, rotation = 0, initialEditing = false, onDragEnd, onNewNoteHandled }) => {
  const { updateNote, deleteNote, updateNotePosition, updateNoteSize, updateNoteRotation } = useNoteStore();
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color || '#fff7c0');
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
      const allColors = [...Object.values(neonColors), ...Object.values(pastelColors)];
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

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    onDragEnd?.(event, info);
    // re-pin: new color and re-trigger animation
    setPinColor(pinColors[Math.floor(Math.random() * pinColors.length)]);
    setPinKey(k => k + 1);
  };

  return (
    <motion.div
      transition={{ default: { duration: 0 } }}
      initial={false}
      className={`note-draggable absolute rounded-lg shadow-lg ${isEditing ? 'overflow-y-auto' : 'overflow-hidden'}`}
      onWheelCapture={(e) => { if (isEditing && e.deltaY !== 0) e.stopPropagation(); }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: isEditing ? 1 : 1.15 }}
      style={{
        x: note.position.x,
        y: note.position.y,
        rotate: rotation,
        transformOrigin: 'center center',
        zIndex: isHovered ? 9999 : note.zIndex,
        backgroundColor: color,
        width: isEditing ? EDIT_MODE_SIZE : SIZE_OPTIONS[selectedSize].width,
        height: isEditing ? EDIT_MODE_SIZE : SIZE_OPTIONS[selectedSize].height,
      }}
      drag={!isEditing}
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        updateNotePosition(note.id, note.position);
      }}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        onDragEnd?.(e, info);
      }}
    >
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
          {/* Editor container: content scrolls, controls fixed at bottom */}
          <div className="flex flex-col h-full">
            {/* Note editing inner padding: adjust the 'p-2' value as needed */}
            <div className="flex-1 p-1">
              <input
                className="w-full bg-transparent border-b border-gray-400 focus:outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={() => initialEditing && title === note.title && setTitle('')}
              />
              <div className="mt-2 h-full">
                {/* @ts-ignore */}
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={quillModules}
                  formats={quillFormats}
                  className="h-56" // adjust height as needed
                />
              </div>
            </div>
            <div className="flex justify-center flex-wrap gap-1 py-1">
              {[...Object.values(neonColors), ...Object.values(pastelColors)].map((hex, idx) => (
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
            className={`mt-0 flex-1 relative text-sm scrollbar-container ${hasOverflow ? 'overflow-y-auto overscroll-contain' : 'overflow-hidden'}`}
            onWheelCapture={e => {
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
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl border border-gray-200">
            <p className="text-center text-gray-900 font-semibold text-lg mb-4">
              정말 이 노트를 삭제하시겠습니까?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                취소
              </button>
              <button
                onClick={() => { deleteNote(note.id); setShowDeleteConfirm(false); }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NoteComponent; 