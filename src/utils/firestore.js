import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';

// 予約データの保存
export const saveReservation = async (reservationData) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const docRef = await addDoc(reservationsRef, {
      ...reservationData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      status: 'confirmed'
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving reservation:', error);
    throw error;
  }
};

// ユーザーの予約履歴の取得
export const getUserReservations = async (userId) => {
  try {
    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

// 特定の日付の予約状況を取得
export const getDateReservations = async (date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const reservationsRef = collection(db, 'reservations');
    const q = query(
      reservationsRef,
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching date reservations:', error);
    throw error;
  }
};

// 予約可能な時間枠の取得
export const getAvailableTimeSlots = async (date, seatType) => {
  try {
    const reservations = await getDateReservations(date);
    const timeSlots = generateTimeSlots(); // 営業時間の時間枠を生成
    
    // 各時間枠の予約状況をチェック
    return timeSlots.map(slot => {
      const reservationsAtTime = reservations.filter(
        r => r.time === slot.time && r.seatType === seatType
      );
      return {
        ...slot,
        available: calculateAvailability(reservationsAtTime, seatType)
      };
    });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    throw error;
  }
};

// 営業時間の時間枠を生成
const generateTimeSlots = () => {
  const slots = [];
  const startHour = 17; // 17:00開始
  const endHour = 22;   // 22:00終了
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        maxSeats: {
          counter: 8,    // カウンター席の最大数
          table: 16      // テーブル席の最大数
        }
      });
    }
  }
  return slots;
};

// 予約可能かどうかを計算
const calculateAvailability = (reservations, seatType) => {
  const maxSeats = seatType === 'counter' ? 8 : 16;
  const reservedSeats = reservations.reduce(
    (total, reservation) => total + reservation.numberOfPeople,
    0
  );
  return reservedSeats < maxSeats;
};

// 予約のキャンセル
export const cancelReservation = async (reservationId, reason = '') => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    await updateDoc(reservationRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now(),
      cancellationReason: reason,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    throw error;
  }
};

// 予約の詳細情報を取得
export const getReservationById = async (reservationId) => {
  try {
    const reservationRef = doc(db, 'reservations', reservationId);
    const docSnap = await getDoc(reservationRef);
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }
    throw new Error('Reservation not found');
  } catch (error) {
    console.error('Error fetching reservation:', error);
    throw error;
  }
}; 