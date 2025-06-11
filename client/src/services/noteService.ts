import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { firebaseDb as db } from '../firebase/config';
import { Note } from '../store/noteStore';
import { incrRead, incrWrite, incrDelete, incrBytesWritten } from '../utils/firebaseUsage';

export const createNote = async (
  userId: string,
  folderId: string,
  title: string,
  content: string,
  position: { x: number; y: number },
  zIndex: number
): Promise<Note> => {
  console.log(`Creating note for userId: ${userId} in folderId: ${folderId}`);
  try {
    const notesRef = collection(db, 'notes');
    const DEFAULT_COLOR = '#fff7c0';
    const DEFAULT_ROTATION = 0;
    const DEFAULT_SIZE_CATEGORY = 'S';
    const noteData = {
      userId,
      folderId,
      title,
      content,
      position,
      zIndex,
      color: DEFAULT_COLOR,
      rotation: DEFAULT_ROTATION,
      sizeCategory: DEFAULT_SIZE_CATEGORY,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(notesRef, noteData);
    incrWrite();
    incrBytesWritten(JSON.stringify(noteData).length);
    console.log('Note created successfully with ID:', docRef.id);
    return {
      id: docRef.id,
      title,
      content,
      position,
      zIndex,
      folderId,
      color: DEFAULT_COLOR,
      rotation: DEFAULT_ROTATION,
      sizeCategory: DEFAULT_SIZE_CATEGORY,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Error creating note in Firestore:", error);
    throw error;
  }
};

export const updateNote = async (
  noteId: string,
  data: Partial<{
    title: string;
    content: string;
    position: { x: number; y: number };
    color: string;
  }>
): Promise<void> => {
  const noteRef = doc(db, 'notes', noteId);
  await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
  incrWrite();
  incrBytesWritten(JSON.stringify(data).length);
};

export const deleteNote = async (noteId: string): Promise<void> => {
  const noteRef = doc(db, 'notes', noteId);
  await deleteDoc(noteRef);
  incrWrite();
  incrDelete();
};

export const getNotes = async (userId: string, folderId: string): Promise<Note[]> => {
  const q = query(
    collection(db, 'notes'),
    where('userId', '==', userId),
    where('folderId', '==', folderId)
  );

  const querySnapshot = await getDocs(q);
  incrRead(querySnapshot.docs.length);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      title: data.title,
      content: data.content,
      position: data.position,
      zIndex: data.zIndex || 0,
      folderId: data.folderId,
      color: data.color || '#fff7c0',
      rotation: data.rotation || 0,
      sizeCategory: data.sizeCategory || 'S',
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    };
  });
};

export const updateNotesPositions = async (
  notes: { id: string; position: { x: number; y: number }; zIndex: number; rotation: number; sizeCategory: string }[]
): Promise<void> => {
  const batch = writeBatch(db);

  notes.forEach(({ id, position, zIndex, rotation, sizeCategory }) => {
    const noteRef = doc(db, 'notes', id);
    batch.update(noteRef, {
      position,
      zIndex,
      rotation,
      sizeCategory,
      updatedAt: serverTimestamp(),
    });
  });

  await batch.commit();
  incrWrite(notes.length);
  {
    const totalBytes = notes.reduce(
      (sum, n) => sum + JSON.stringify({ position: n.position, zIndex: n.zIndex, rotation: n.rotation, sizeCategory: n.sizeCategory }).length,
      0
    );
    incrBytesWritten(totalBytes);
  }
};

export const moveNoteToFolder = async (
  noteId: string,
  newFolderId: string,
  position?: { x: number; y: number },
  rotation?: number,
  zIndex?: number
): Promise<void> => {
  const noteRef = doc(db, 'notes', noteId);
  const updateData: any = {
    folderId: newFolderId,
    updatedAt: serverTimestamp(),
  };
  if (position) {
    updateData.position = position;
  }
  if (rotation !== undefined) {
    updateData.rotation = rotation;
  }
  if (zIndex !== undefined) {
    updateData.zIndex = zIndex;
  }
  await updateDoc(noteRef, updateData);
}; 