import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../utils/dateUtils';

const ReservationList = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const reservationData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReservations(reservationData);
      } catch (error) {
        console.error('予約データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchReservations();
    }
  }, [currentUser]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">予約一覧</h1>
        
        {reservations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">予約がありません</p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <li key={reservation.id} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">予約番号</p>
                      <p className="mt-1 text-sm text-gray-900">{reservation.reservationId}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">予約日時</p>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(reservation.date)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">人数</p>
                      <p className="mt-1 text-sm text-gray-900">{reservation.numberOfPeople}名</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">座席タイプ</p>
                      <p className="mt-1 text-sm text-gray-900">{reservation.seatType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">コース</p>
                      <p className="mt-1 text-sm text-gray-900">{reservation.courseType}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">お支払い金額</p>
                      <p className="mt-1 text-sm text-gray-900">¥{reservation.totalAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservationList; 