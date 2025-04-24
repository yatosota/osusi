import { useState, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export const useFirestore = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // 予約を作成
  const createReservation = useCallback(async (reservationData) => {
    try {
      setLoading(true);
      setError(null);
      
      const docRef = await addDoc(collection(db, 'reservations'), {
        ...reservationData,
        userId: user.uid,
        createdAt: serverTimestamp(),
        status: 'pending' // pending, confirmed, cancelled
      });
      
      return docRef.id;
    } catch (err) {
      setError('予約の作成に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ユーザーの予約一覧を取得
  const getUserReservations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, 'reservations'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      const reservations = [];
      
      querySnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return reservations;
    } catch (err) {
      setError('予約の取得に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 予約をキャンセル
  const cancelReservation = useCallback(async (reservationId) => {
    try {
      setLoading(true);
      setError(null);

      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'cancelled',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError('予約のキャンセルに失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 予約を更新
  const updateReservation = useCallback(async (reservationId, updateData) => {
    try {
      setLoading(true);
      setError(null);

      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      setError('予約の更新に失敗しました');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createReservation,
    getUserReservations,
    cancelReservation,
    updateReservation
  };
}; 