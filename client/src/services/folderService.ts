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
import { Folder } from '../store/noteStore';
import { incrRead, incrWrite, incrDelete, incrBytesWritten } from '../utils/firebaseUsage';

export const createFolder = async (userId: string, name: string): Promise<Folder> => {
  console.log(`Creating folder for userId: ${userId} with name: ${name}`);
  try {
    const foldersRef = collection(db, 'folders');
    const folderData = {
      name,
      userId,
      ocdEnabled: false,
      createdAt: serverTimestamp(),
      order: serverTimestamp(),
    };
    const docRef = await addDoc(foldersRef, folderData);
    incrWrite();
    incrBytesWritten(JSON.stringify(folderData).length);
    console.log('Folder created successfully with ID:', docRef.id);
    return {
      id: docRef.id,
      name,
      createdAt: new Date(),
      ocdEnabled: false,
      order: Date.now(),
    };
  } catch (error) {
    console.error("Error creating folder in Firestore:", error);
    throw error; // propagate error for UI to handle
  }
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, { name });
  incrWrite();
  incrBytesWritten(JSON.stringify({ name }).length);
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await deleteDoc(folderRef);
  incrWrite();
  incrDelete();
};

export const getFolders = async (userId: string): Promise<Folder[]> => {
  const foldersRef = collection(db, 'folders');
  const q = query(foldersRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  incrRead(querySnapshot.docs.length);
  
  const folders = querySnapshot.docs.map(doc => {
    const data = doc.data();
    // Determine order value: Firestore Timestamp or numeric
    let orderValue: number;
    const rawOrder = data.order;
    if (rawOrder && typeof (rawOrder as any).toMillis === 'function') {
      orderValue = (rawOrder as any).toMillis();
    } else if (typeof rawOrder === 'number') {
      orderValue = rawOrder;
    } else {
      orderValue = data.createdAt.toDate().getTime();
    }
    return {
      id: doc.id,
      name: data.name,
      createdAt: data.createdAt.toDate(),
      ocdEnabled: data.ocdEnabled ?? false,
      order: orderValue,
    };
  });
  // Sort folders locally by order field
  folders.sort((a, b) => a.order - b.order);
  return folders;
};

/** Update folder settings such as OCD toggle */
export const updateFolderSettings = async (
  folderId: string,
  settings: Partial<{ ocdEnabled: boolean }>
): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, settings);
  incrWrite();
  incrBytesWritten(JSON.stringify(settings).length);
};

/** Batch update folder order */
export const updateFoldersOrder = async (
  folderOrders: { id: string; order: number }[]
): Promise<void> => {
  const batch = writeBatch(db);
  folderOrders.forEach(({ id, order }) => {
    const folderRef = doc(db, 'folders', id);
    batch.update(folderRef, { order });
  });
  await batch.commit();
  incrWrite(folderOrders.length);
  {
    const totalBytes = folderOrders.reduce((sum, fo) => sum + JSON.stringify({ order: fo.order }).length, 0);
    incrBytesWritten(totalBytes);
  }
}; 