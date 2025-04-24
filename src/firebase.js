import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

// Firebase Configuration
// Firebase設定
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
// Firebase設定の検証
const validateConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ];

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required Firebase configuration fields: ${missingFields.join(', ')}`);
  }
};

validateConfig();

// Initialize Firebase
// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Auth
// FirestoreとAuthの初期化
export const db = getFirestore(app);
export const auth = getAuth(app);

// Connect to emulators in development first
// 開発環境でエミュレータに接続（最初に行う）
if (process.env.NODE_ENV === 'development') {
  const EMULATOR_HOST = 'localhost';
  const FIRESTORE_PORT = 8081;
  const AUTH_PORT = 9098;

  console.log('Connecting to Firebase emulators...');
  try {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_PORT}`, { disableWarnings: true });
    connectFirestoreEmulator(db, EMULATOR_HOST, FIRESTORE_PORT);
    console.log('Successfully connected to Firebase emulators');
  } catch (error) {
    console.error('Failed to connect to emulators:', error);
  }
}

// Enable offline persistence after emulator connection
// エミュレータ接続後にオフライン永続化を有効化
try {
  enableMultiTabIndexedDbPersistence(db)
    .catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support persistence.');
      }
    });
} catch (error) {
  console.error('Failed to enable persistence:', error);
}

export default app; 