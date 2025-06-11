import { create } from 'zustand';
import * as noteService from '../services/noteService';
import * as folderService from '../services/folderService';
import { firebaseAuth } from '../firebase/config';
import { getNoteById } from '../services/noteService';

export interface Note {
  id: string;
  title: string;
  content: string;
  position: { x: number; y: number };
  color: string;
  zIndex: number;
  rotation: number;
  sizeCategory: string;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: Date;
  ocdEnabled: boolean;
  order: number;
}

const MAX_ROTATION_ON_MOVE = 5;

interface NoteStore {
  notes: Note[];
  folders: Folder[];
  selectedFolderId: string | null;
  unsavedChanges: boolean;
  isLoading: boolean;
  error: string | null;

  // Folder actions
  loadFolders: (userId: string) => Promise<void>;
  createFolder: (userId: string, name: string) => Promise<void>;
  updateFolder: (folderId: string, name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  setSelectedFolder: (folderId: string) => void;
  updateFolderSettings: (folderId: string, ocdEnabled: boolean) => Promise<void>;
  reorderFolders: (newOrder: Folder[]) => void;

  // Note actions
  loadNotes: (userId: string, folderId: string, forceFetch?: boolean) => Promise<void>;
  createNote: (userId: string, title: string, content: string) => Promise<Note>;
  updateNote: (noteId: string, data: Partial<{ title: string; content: string; color: string }>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  updateNotePosition: (noteId: string, position: { x: number; y: number }) => void;
  saveNotePositions: () => Promise<void>;
  updateNoteRotation: (noteId: string, rotation: number) => void;
  updateNoteSize: (noteId: string, sizeCategory: string) => void;
  moveNoteToFolder: (
    noteId: string,
    newFolderId: string,
    position?: { x: number; y: number }
  ) => Promise<void>;

  // UI state
  setUnsavedChanges: (value: boolean) => void;
  setError: (error: string | null) => void;
}

const useNoteStore = create<NoteStore>((set, get) => {
  // In-memory cache: folderId -> notes array
  const notesCache: Record<string, Note[]> = {};
  // Track which notes have unsaved layout changes
  const changedNoteIds = new Set<string>();
  return {
    notes: [],
    folders: [],
    selectedFolderId: null,
    unsavedChanges: false,
    isLoading: false,
    error: null,

    // Folder actions
    loadFolders: async (userId: string) => {
      try {
        set({ isLoading: true, error: null });
        const folders = await folderService.getFolders(userId);
        set({ folders, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to load folders', isLoading: false });
      }
    },

    createFolder: async (userId: string, name: string) => {
      try {
        set({ isLoading: true, error: null });
        const newFolder = await folderService.createFolder(userId, name);
        set(state => ({
          folders: [...state.folders, newFolder],
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to create folder', isLoading: false });
      }
    },

    updateFolder: async (folderId: string, name: string) => {
      try {
        set({ isLoading: true, error: null });
        await folderService.updateFolder(folderId, name);
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, name } : folder
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update folder', isLoading: false });
      }
    },

    deleteFolder: async (folderId: string) => {
      try {
        set({ isLoading: true, error: null });
        await folderService.deleteFolder(folderId);
        set(state => ({
          folders: state.folders.filter(folder => folder.id !== folderId),
          selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId,
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to delete folder', isLoading: false });
      }
    },

    setSelectedFolder: (folderId: string) => set({ selectedFolderId: folderId }),

    updateFolderSettings: async (folderId: string, ocdEnabled: boolean) => {
      try {
        set({ isLoading: true, error: null });
        await folderService.updateFolderSettings(folderId, { ocdEnabled });
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId ? { ...folder, ocdEnabled } : folder
          ),
          isLoading: false
        }));
      } catch (error) {
        set({ error: 'Failed to update folder settings', isLoading: false });
      }
    },

    // Reorder folder list locally
    reorderFolders: (newOrder: Folder[]) => {
      set({ folders: newOrder });
      // Persist the new order to backend (batch update)
      folderService.updateFoldersOrder(
        newOrder.map((folder, index) => ({ id: folder.id, order: index }))
      );
    },

    // Note actions
    loadNotes: async (userId: string, folderId: string, forceFetch = false) => {
      // Use cache if available, unless forced
      if (!forceFetch && notesCache[folderId]) {
        set({ notes: notesCache[folderId], isLoading: false });
        return;
      }
      try {
        set({ isLoading: true, error: null });
        const notes = await noteService.getNotes(userId, folderId);
        notesCache[folderId] = notes;
        set({ notes, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to load notes', isLoading: false });
      }
    },

    createNote: async (userId: string, title: string, content: string): Promise<Note> => {
      const { selectedFolderId, notes } = get();
      if (!selectedFolderId) throw new Error('No folder selected');

      try {
        set({ isLoading: true, error: null });
        const maxZIndex = Math.max(...notes.map(note => note.zIndex), 0);
        const position = { x: Math.random() * 100, y: Math.random() * 100 };
        const newNote = await noteService.createNote(
          userId,
          selectedFolderId,
          title,
          content,
          position,
          maxZIndex + 1
        );
        set(state => {
          const updated = [...state.notes, newNote];
          // update cache
          notesCache[selectedFolderId] = updated;
          return { notes: updated, isLoading: false };
        });
        return newNote;
      } catch (error) {
        set({ error: 'Failed to create note', isLoading: false });
        throw error;
      }
    },

    updateNote: async (noteId: string, data: Partial<{ title: string; content: string; color: string }>) => {
      try {
        set({ isLoading: true, error: null });
        await noteService.updateNote(noteId, data);
        set(state => {
          const updated = state.notes.map(note =>
            note.id === noteId ? { ...note, ...data, updatedAt: new Date() } : note
          );
          // update cache
          if (state.selectedFolderId) notesCache[state.selectedFolderId] = updated;
          return { notes: updated, isLoading: false };
        });
      } catch (error) {
        set({ error: 'Failed to update note', isLoading: false });
      }
    },

    deleteNote: async (noteId: string) => {
      try {
        set({ isLoading: true, error: null });
        await noteService.deleteNote(noteId);
        set(state => {
          const updated = state.notes.filter(note => note.id !== noteId);
          // update cache
          if (state.selectedFolderId) notesCache[state.selectedFolderId] = updated;
          return { notes: updated, isLoading: false };
        });
      } catch (error) {
        set({ error: 'Failed to delete note', isLoading: false });
      }
    },

    updateNotePosition: (noteId: string, position: { x: number; y: number }) => {
      // mark this note as changed
      changedNoteIds.add(noteId);
      set(state => {
        const maxZIndex = Math.max(...state.notes.map(note => note.zIndex), 0);
        const newZIndex = maxZIndex + 1;
        // assign new z-index to moved note
        const updatedNotes = state.notes.map(note =>
          note.id === noteId ? { ...note, position, zIndex: newZIndex } : note
        );
        // renormalize all z-indices if threshold reached
        if (newZIndex >= 100) {
          const sorted = [...updatedNotes].sort((a, b) => a.zIndex - b.zIndex);
          const renormalized = sorted.map((note, idx) => ({ ...note, zIndex: idx + 1 }));
          return { notes: renormalized, unsavedChanges: true };
        }
        return { notes: updatedNotes, unsavedChanges: true };
      });
    },

    updateNoteRotation: (noteId: string, rotation: number) => {
      // mark this note as changed
      changedNoteIds.add(noteId);
      set(state => ({
        notes: state.notes.map(note => note.id === noteId ? { ...note, rotation } : note),
        unsavedChanges: true
      }));
    },

    updateNoteSize: (noteId: string, sizeCategory: string) => {
      // mark this note as changed
      changedNoteIds.add(noteId);
      set(state => ({
        notes: state.notes.map(note => note.id === noteId ? { ...note, sizeCategory } : note),
        unsavedChanges: true
      }));
    },

    moveNoteToFolder: async (
      noteId: string,
      newFolderId: string,
      position?: { x: number; y: number }
    ) => {
      try {
        set({ isLoading: true, error: null });
        // Compute random rotation and zIndex for new folder
        const angle = (Math.random() * 2 - 1) * MAX_ROTATION_ON_MOVE;
        const beforeCache = notesCache[newFolderId] ?? [];
        const maxZ = beforeCache.reduce((max, n) => Math.max(max, n.zIndex), 0);
        const newZ = maxZ + 1;
        // Update Firestore with new folderId and metadata
        await noteService.moveNoteToFolder(noteId, newFolderId, position, angle, newZ);
        // Remove note from old folder cache
        const oldFolderId = get().selectedFolderId;
        if (oldFolderId && notesCache[oldFolderId]) {
          notesCache[oldFolderId] = notesCache[oldFolderId].filter(n => n.id !== noteId);
        }
        // Fetch only the moved note from Firestore
        const fetchedNote = await getNoteById(noteId);
        // Update new folder cache
        const newCache = notesCache[newFolderId] ?? [];
        notesCache[newFolderId] = [...newCache, fetchedNote];
        // Switch to new folder and display updated cache
        set({
          notes: notesCache[newFolderId],
          selectedFolderId: newFolderId,
          isLoading: false
        });
      } catch (error) {
        set({ error: 'Failed to move note', isLoading: false });
      }
    },

    saveNotePositions: async () => {
      const { notes, selectedFolderId } = get();
      // only save notes that have been changed
      const changedNotes = notes.filter(note => changedNoteIds.has(note.id));
      if (changedNotes.length === 0) {
        // nothing to save
        return;
      }
      try {
        set({ isLoading: true, error: null });
        await noteService.updateNotesPositions(
          changedNotes.map(note => ({ id: note.id, position: note.position, zIndex: note.zIndex, rotation: note.rotation, sizeCategory: note.sizeCategory }))
        );
        // update cache for current folder so loadNotes returns updated positions
        if (selectedFolderId) {
          notesCache[selectedFolderId] = notes;
        }
        // clear change tracking and reset flag
        changedNoteIds.clear();
        set({ unsavedChanges: false, isLoading: false });
      } catch (error) {
        set({ error: 'Failed to save note positions', isLoading: false });
      }
    },

    // UI state
    setUnsavedChanges: (value: boolean) => set({ unsavedChanges: value }),
    setError: (error: string | null) => set({ error })
  };
});

export default useNoteStore; 