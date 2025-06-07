import React, { useState, useEffect, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { Note } from '../store/noteStore';
import useNoteStore from '../store/noteStore';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
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

interface NoteProps {
  note: Note;
  rotation?: number;  // rotation angle in degrees
  initialEditing?: boolean;
  onNewNoteHandled?: () => void;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}

const NoteComponent: React.FC<NoteProps> = ({ note, rotation = 0, initialEditing = false, onDragEnd, onNewNoteHandled }) => {
  const { updateNote, deleteNote, updateNotePosition, updateNoteSize } = useNoteStore();
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [color, setColor] = useState(note.color || '#fff7c0');
  const [isDragging, setIsDragging] = useState(false);
  // S, M, L size selection
  const defaultSize = note.sizeCategory as 'S'|'M'|'L';
  const [selectedSize, setSelectedSize] = useState<'S'|'M'|'L'>(defaultSize);
  // store previous size to revert on cancel
  const prevSizeRef = useRef<'S'|'M'|'L'>(defaultSize);
  // delete confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleSave = () => {
    // apply selected note size
    updateNoteSize(note.id, selectedSize);
    // persist title/content/color
    updateNote(note.id, { title, content, color });
    // if this was a newly created note, notify parent
    if (initialEditing && onNewNoteHandled) onNewNoteHandled();
    setIsEditing(false);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    onDragEnd?.(event, info);
  };

  return (
    <motion.div
      className={`note-draggable absolute rounded-lg shadow-lg ${!isEditing ? 'overflow-hidden' : ''}`}
      style={{
        x: note.position.x,
        y: note.position.y,
        rotate: rotation,  // apply tilt
        zIndex: note.zIndex,
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
      whileHover={{ scale: 1.02 }}
    >
      {/* Pin animation */}
      <motion.div
        className="absolute top-0 left-1/2 w-3 h-3 bg-red-600 rounded-full shadow-md"
        style={{ transform: 'translate(-50%, -100%)' }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 500, damping: 25 }}
      />

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
            <div className="flex-1 p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
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
        <div className="p-4">
          <div className="flex justify-between items-start">
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
          {/* Render rich text (including lists) using Quill styles */}
          <div className="text-sm mt-2">
            <div className="ql-snow">
              <div
                className="ql-editor p-0 [&_ul]:!pl-0 [&_ol]:!pl-0 [&_ul]:!-ml-6 [&_ol]:!-ml-6 [&_ul]:!mt-0 [&_ol]:!mt-0 [&_ul]:!mb-0 [&_ol]:!mb-0 [&_ul]:list-outside [&_ol]:list-outside"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          </div>
        </div>
      )}
      {/* delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-md p-4 w-64">
            <p className="text-center text-gray-800">정말 이 노트를 삭제하시겠습니까?</p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 bg-gray-200 rounded">취소</button>
              <button onClick={() => { deleteNote(note.id); setShowDeleteConfirm(false); }} className="px-3 py-1 bg-red-500 text-white rounded">삭제</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NoteComponent; 