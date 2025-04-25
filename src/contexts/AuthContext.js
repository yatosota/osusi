import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  doc, 
  setDoc,
  getDoc,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await loadUserData(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function loginAsGuest() {
    try {
      const userCredential = await signInAnonymously(auth);
      await loadUserData(userCredential.user);
      return userCredential;
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  }

  async function register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await createUserDocument(userCredential.user, userData);
      return userCredential;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await signOut(auth);
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function loadUserData(user) {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setCurrentUser({
          ...user,
          ...userDoc.data()
        });
      } else {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setError('ユーザーデータの読み込みに失敗しました');
    }
  }

  async function createUserDocument(user, additionalData) {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    try {
      await setDoc(userRef, {
        email: user.email,
        createdAt: new Date(),
        ...additionalData
      }, { merge: true });
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadUserData(user);
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    isOffline,
    login,
    logout,
    register,
    loginAsGuest,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 