import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, inMemoryPersistence, setPersistence, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY as string,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID as string,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.REACT_APP_FIREBASE_APP_ID as string,
};

class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private storage: FirebaseStorage;
  private initialized = false;

  private constructor() {
   // 기존 앱이 있으면 재사용, 없으면 새로 초기화
if (getApps().length > 0) {
  this.app = getApp(); // 기존 앱 재사용
} else {
  this.app = initializeApp(firebaseConfig); // 새로 초기화
}
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);

    this.initializeEmulators();
  }

  private initializeEmulators() {
    if (this.initialized) return;

    // Only connect to emulators in development
    if (process.env.NODE_ENV === 'development') {
      try {
        setPersistence(this.auth, inMemoryPersistence);
        connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
        connectFirestoreEmulator(this.db, '127.0.0.1', 8080);
        connectStorageEmulator(this.storage, '127.0.0.1', 9199);
        console.log('Connected to Firebase emulators');
      } catch (error) {
        console.error('Error connecting to Firebase emulators:', error);
        throw error;
      }
    }
    // In production, skip emulator connection
    this.initialized = true;
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  public getApp(): FirebaseApp {
    return this.app;
  }

  public getAuth(): Auth {
    return this.auth;
  }

  public getDb(): Firestore {
    return this.db;
  }

  public getStorage(): FirebaseStorage {
    return this.storage;
  }
}

// Firebase 서비스 인스턴스 생성
const firebaseService = FirebaseService.getInstance();

// 외부로 내보내기
export const firebaseApp = firebaseService.getApp();
export const firebaseAuth = firebaseService.getAuth();
export const firebaseDb = firebaseService.getDb();
export const firebaseStorage = firebaseService.getStorage(); 