import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, inMemoryPersistence, setPersistence, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics } from 'firebase/analytics';

// Firebase config, override projectId to 'corknote' in development for emulator
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY as string,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN as string,
  projectId: process.env.NODE_ENV === 'development'
    ? 'corknote' // use emulator default project ID
    : (process.env.REACT_APP_FIREBASE_PROJECT_ID as string),
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: process.env.REACT_APP_FIREBASE_APP_ID as string,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID as string,
};

class FirebaseService {
  private static instance: FirebaseService;
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private storage: FirebaseStorage;
  private analytics?: Analytics;
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

    // Initialize Analytics (only in browser)
    if (typeof window !== 'undefined') {
      try {
        this.analytics = getAnalytics(this.app);
      } catch (err) {
        console.warn('Firebase Analytics initialization failed:', err);
      }
    }

    this.initializeEmulators();
  }

  private initializeEmulators() {
    if (this.initialized) return;

    // Connect to emulators when running on localhost (any NODE_ENV)
    if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      const host = window.location.hostname;
      try {
        setPersistence(this.auth, inMemoryPersistence);
        // Connect to Auth Emulator
        connectAuthEmulator(this.auth, `http://${host}:9099`, { disableWarnings: true });
        // Connect to Firestore Emulator
        connectFirestoreEmulator(this.db, host, 8080);
        // Connect to Storage Emulator
        connectStorageEmulator(this.storage, host, 9199);
        console.log('Connected to Firebase emulators on', host);
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

  public getAnalytics(): Analytics | undefined {
    return this.analytics;
  }
}

// Firebase 서비스 인스턴스 생성
const firebaseService = FirebaseService.getInstance();

// 외부로 내보내기
export const firebaseApp = firebaseService.getApp();
export const firebaseAuth = firebaseService.getAuth();
export const firebaseDb = firebaseService.getDb();
export const firebaseStorage = firebaseService.getStorage();
export const firebaseAnalytics = firebaseService.getAnalytics(); 