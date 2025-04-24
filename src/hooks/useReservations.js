import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';

export const useReservations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 予約を作成
  const createReservation = async (reservationData) => {
    setLoading(true);
    setError(null);
    try {
      const docRef = await addDoc(collection(db, 'reservations'), {
        ...reservationData,
        createdAt: Timestamp.now(),
        status: 'confirmed'
      });
      setLoading(false);
      return { success: true, id: docRef.id };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // 指定された日付の予約可能時間を取得
  const getAvailableTimes = async (date) => {
    setLoading(true);
    setError(null);
    try {
      // 指定された日付の予約を取得
      const q = query(
        collection(db, 'reservations'),
        where('date', '==', date)
      );
      const querySnapshot = await getDocs(q);
      
      // 予約済み時間のマップを作成
      const reservedTimes = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        reservedTimes[data.time] = true;
      });

      // 利用可能な時間枠（17:30から20:30まで、30分間隔）
      const allTimes = [
        '17:30', '18:00', '18:30', '19:00', 
        '19:30', '20:00', '20:30'
      ];

      // 予約可能な時間枠をフィルタリング
      const availableTimes = allTimes.filter(time => !reservedTimes[time]);

      setLoading(false);
      return { success: true, times: availableTimes };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  // ユーザーの予約一覧を取得
  const getUserReservations = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const q = query(
        collection(db, 'reservations'),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      const reservations = [];
      querySnapshot.forEach((doc) => {
        reservations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setLoading(false);
      return { success: true, reservations };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return { success: false, error: err.message };
    }
  };

  return {
    loading,
    error,
    createReservation,
    getAvailableTimes,
    getUserReservations
  };
}; 