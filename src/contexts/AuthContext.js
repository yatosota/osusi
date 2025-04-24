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
  getDoc
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Firebase login
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (userDoc.exists()) {
        setCurrentUser({ ...userCredential.user, ...userDoc.data() });
      }
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('ログインに失敗しました');
    }
  };

  // Guest login
  const loginAsGuest = async () => {
    try {
      const guestCredential = await signInAnonymously(auth);
      // ゲストユーザー情報をFirestoreに保存
      await setDoc(doc(db, 'users', guestCredential.user.uid), {
        name: 'ゲスト',
        nameKana: 'ゲスト',
        isGuest: true,
        createdAt: new Date()
      });
      setCurrentUser({
        ...guestCredential.user,
        name: 'ゲスト',
        isGuest: true
      });
      return guestCredential.user;
    } catch (error) {
      console.error('Guest login error:', error);
      throw new Error('ゲストログインに失敗しました');
    }
  };

  // Firebase logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('ログアウトに失敗しました');
    }
  };

  // Firebase registration
  const register = async (email, password, userData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Store additional user data in Firestore
      const userDataToStore = {
        email: email,
        name: userData.name,
        nameKana: userData.nameKana || userData.name, // nameKanaがない場合はnameを使用
        phone: userData.phone,
        createdAt: new Date(),
        isGuest: false,
        ...userData
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDataToStore);

      setCurrentUser({
        ...userCredential.user,
        ...userDataToStore
      });

      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('アカウントの作成に失敗しました');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore when auth state changes
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ ...user, ...userDoc.data() });
        } else {
          setCurrentUser(user);
        }
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
    login,
    logout,
    register,
    loginAsGuest
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext; 