import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { firebaseDb as db } from '../firebase/config';
import { Folder } from '../store/noteStore';

export const createFolder = async (userId: string, name: string): Promise<Folder> => {
  console.log(`Creating folder for userId: ${userId} with name: ${name}`);
  try {
    const foldersRef = collection(db, 'folders');
    const folderData = {
      name,
      userId,
      ocdEnabled: false,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(foldersRef, folderData);
    console.log('Folder created successfully with ID:', docRef.id);
    return {
      id: docRef.id,
      name,
      createdAt: new Date(),
      ocdEnabled: false,
    };
  } catch (error) {
    console.error("Error creating folder in Firestore:", error);
    throw error; // 에러를 상위로 전파하여 UI에서 인지할 수 있도록 함
  }
};

export const updateFolder = async (folderId: string, name: string): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, { name });
};

export const deleteFolder = async (folderId: string): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await deleteDoc(folderRef);
};

export const getFolders = async (userId: string): Promise<Folder[]> => {
  const foldersRef = collection(db, 'folders');
  const q = query(foldersRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      createdAt: data.createdAt.toDate(),
      ocdEnabled: data.ocdEnabled ?? false,
    };
  });
};

/** Update folder settings such as OCD toggle */
export const updateFolderSettings = async (
  folderId: string,
  settings: Partial<{ ocdEnabled: boolean }>
): Promise<void> => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, settings);
}; 