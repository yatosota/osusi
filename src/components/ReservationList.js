import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ReservationList = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
          navigate('/login');
          return;
        }

        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', userId)
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

    fetchReservations();
  }, [navigate]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-500 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">予約一覧</h2>
          </div>

          <div className="p-6">
            {reservations.length === 0 ? (
              <p className="text-center text-gray-600">予約がありません</p>
            ) : (
              <div className="space-y-6">
                {reservations.map((reservation) => (
                  <div
                    key={reservation.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-lg text-gray-900">
                          {formatDate(reservation.date)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {reservation.numberOfPeople}名 / {reservation.seatType}
                        </p>
                        {reservation.courseType && (
                          <p className="text-sm text-gray-600">
                            コース: {reservation.courseType}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          reservation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {reservation.status === 'confirmed' ? '予約確定' :
                           reservation.status === 'cancelled' ? 'キャンセル済み' :
                           '処理中'}
                        </span>
                        <p className="mt-1 text-sm text-gray-600">
                          予約番号: {reservation.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={() => navigate('/new-reservation')}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                新規予約
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationList; 