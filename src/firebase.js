import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase Configuration
// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBDocMFnHMPttNFzRrNPH6Sdt7-YNQIrJY",
  authDomain: "osusi-reservation.firebaseapp.com",
  projectId: "osusi-reservation",
  storageBucket: "osusi-reservation.appspot.com",
  messagingSenderId: "642156990249",
  appId: "1:642156990249:web:0c5e0d3d2a3b2c0c0c0c0c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore with settings
const db = getFirestore(app);

// Enable offline persistence with error handling
const initializeFirestore = async () => {
  try {
    await enableIndexedDbPersistence(db, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    console.log('Offline persistence enabled successfully');
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence disabled');
    } else if (err.code === 'unimplemented') {
      console.warn('Current browser does not support persistence');
    } else {
      console.error('Error enabling persistence:', err);
    }
  }
};

// Initialize Firestore settings
initializeFirestore();

export { db, auth };
export default app; 