import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin with emulator configuration
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

initializeApp({
  projectId: 'corknote-local'
});

const db = getFirestore();

// Helper function to upsert a document if it doesn't exist
async function upsertDoc(collectionName, docId, data) {
  const docRef = db.collection(collectionName).doc(docId);
  const snapshot = await docRef.get();
  if (!snapshot.exists) {
    console.log(`Creating ${collectionName}/${docId}`);
    await docRef.set(data);
  } else {
    console.log(`${collectionName}/${docId} already exists`);
  }
}

async function initializeFirestore() {
  try {
    // Initialize Firestore with initial data
    await upsertDoc('folders', 'initial', {
      name: 'Welcome',
      userId: 'system',
      createdAt: FieldValue.serverTimestamp(),
    });

    await upsertDoc('notes', 'welcome', {
      title: 'Welcome to CorkNote',
      content: 'This is your first note!',
      userId: 'system',
      folderId: 'initial',
      position: { x: 100, y: 100 },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('Firestore initialized successfully!');
  } catch (error) {
    console.error('Error initializing Firestore:', error);
  }
}

initializeFirestore(); 