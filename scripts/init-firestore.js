import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin with emulator configuration
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
process.env.FIREBASE_STORAGE_EMULATOR_HOST = 'localhost:9199';

initializeApp({
  projectId: 'corknote-local'
});

const db = getFirestore();

async function initializeFirestore() {
  try {
    // Create collections
    const collections = ['folders', 'notes'];
    
    for (const collectionName of collections) {
      const collectionRef = db.collection(collectionName);
      const doc = await collectionRef.get();
      if (!doc.exists) {
        console.log(`Creating collection: ${collectionName}`);
        await collectionRef.doc('_config').set({
          created: FieldValue.serverTimestamp()
        });
      }
    }

    // Create initial folder
    const folderRef = db.collection('folders').doc('initial');
    await folderRef.set({
      name: 'Welcome',
      userId: 'system',
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create welcome note
    const noteRef = db.collection('notes').doc('welcome');
    await noteRef.set({
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