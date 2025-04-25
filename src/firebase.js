import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED,
  initializeFirestore as initFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore';
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

// より新しいAPIを使用してFirestoreを初期化
// シングルタブ設定でキャッシュをセットアップ
const db = initFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});

console.log('Firestore initialized with persistent single tab cache');

export { db, auth };
export default app; 