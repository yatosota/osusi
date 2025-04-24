import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ReservationHistory = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelStatus, setCancelStatus] = useState({ id: null, loading: false });

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const userId = currentUser?.uid || JSON.parse(sessionStorage.getItem('guestUser'))?.id;
        
        if (!userId) {
          setError('ログインが必要です。');
          setTimeout(() => {
            navigate('/login');
          }, 2000);
          return;
        }

        const q = query(
          collection(db, 'reservations'),
          where('userId', '==', userId),
          orderBy('date', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const reservationData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // 日付データの処理を改善
          let dateObj;
          try {
            if (data.date instanceof Timestamp) {
              dateObj = data.date.toDate();
            } else if (typeof data.date === 'string') {
              dateObj = new Date(data.date);
            } else if (data.date && typeof data.date.seconds === 'number') {
              dateObj = new Date(data.date.seconds * 1000);
            } else {
              console.warn('Invalid date format:', data.date);
              dateObj = new Date(); // フォールバック
            }
          } catch (error) {
            console.error('Date parsing error:', error);
            dateObj = new Date(); // フォールバック
          }

          return {
            id: doc.id,
            ...data,
            date: dateObj
          };
        });

        // 現在時刻より前の予約を「過去の予約」としてマーク
        const now = new Date();
        const processedReservations = reservationData.map(reservation => ({
          ...reservation,
          isPast: reservation.date < now
        }));

        // 未来の予約を先に、過去の予約を後に表示。それぞれの中で日時順にソート
        const sortedReservations = processedReservations.sort((a, b) => {
          if (a.isPast !== b.isPast) {
            return a.isPast ? 1 : -1;
          }
          return a.date - b.date;
        });

        setReservations(sortedReservations);
        setError(null);
      } catch (error) {
        console.error('予約履歴の取得に失敗しました:', error);
        setError('予約履歴の取得に失敗しました。もう一度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [navigate, currentUser]);

  const handleCancelReservation = async (reservationId) => {
    if (!window.confirm('予約をキャンセルしてもよろしいですか？')) {
      return;
    }

    setCancelStatus({ id: reservationId, loading: true });
    try {
      await deleteDoc(doc(db, 'reservations', reservationId));
      
      // 予約リストを更新
      setReservations(prevReservations => 
        prevReservations.map(reservation => 
          reservation.id === reservationId 
            ? { ...reservation, status: 'cancelled' }
            : reservation
        )
      );
    } catch (error) {
      console.error('予約のキャンセルに失敗しました:', error);
      alert('予約のキャンセルに失敗しました。もう一度お試しください。');
    } finally {
      setCancelStatus({ id: null, loading: false });
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) {
        console.warn('Invalid date provided to formatDate:', date);
        return { dateString: '日付不明', timeString: '時間不明' };
      }

      // 日付と時間を別々にフォーマット
      const dateString = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const timeString = date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
      });

      return { dateString, timeString };
    } catch (error) {
      console.error('Date formatting error:', error);
      return { dateString: '日付不明', timeString: '時間不明' };
    }
  };

  // 支払い方法の表示テキストを取得
  const getPaymentMethodText = (method) => {
    switch (method) {
      case 'credit':
        return 'クレジットカード';
      case 'cash':
        return '現金';
      default:
        return '未定';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="bg-blue-500 text-white px-6 py-4">
            <h2 className="text-2xl font-bold">予約履歴</h2>
          </div>

          <div className="p-6">
            {reservations.length === 0 ? (
              <p className="text-center text-gray-600">予約履歴がありません</p>
            ) : (
              <div className="space-y-6">
                {reservations.map((reservation) => {
                  const { dateString, timeString } = formatDate(reservation.date);
                  const isPastReservation = reservation.isPast;
                  
                  return (
                    <div
                      key={reservation.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        isPastReservation ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2">
                          <div>
                            <p className="font-medium text-lg text-gray-900">
                              {dateString}
                            </p>
                            <p className="text-sm text-gray-600">
                              {timeString}
                            </p>
                          </div>
                          {reservation.customerInfo && (
                            <div className="text-sm text-gray-600 border-l-2 border-blue-500 pl-2">
                              <p>
                                予約者: {reservation.customerInfo.name}
                                {reservation.customerInfo.nameKana && (
                                  <span className="text-gray-500 ml-2">
                                    ({reservation.customerInfo.nameKana})
                                  </span>
                                )}
                              </p>
                              <p>電話番号: {reservation.customerInfo.phone}</p>
                              <p>メール: {reservation.customerInfo.email}</p>
                            </div>
                          )}
                          <p className="text-sm text-gray-600">
                            {reservation.numberOfPeople}名 / {reservation.seatType}
                          </p>
                          {reservation.courseType && (
                            <p className="text-sm text-gray-600">
                              コース: {reservation.courseType}
                            </p>
                          )}
                          <div className="text-sm text-gray-600">
                            <p>支払い方法: {getPaymentMethodText(reservation.paymentMethod)}</p>
                            {reservation.cardInfo && (
                              <p className="mt-1">
                                カード番号: ****-****-****-{reservation.cardInfo.lastFourDigits}
                              </p>
                            )}
                          </div>
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
                          <p className="mt-1 text-sm text-gray-600">
                            お支払い: ¥{reservation.totalAmount?.toLocaleString() || '0'}
                          </p>
                          {!isPastReservation && reservation.status === 'confirmed' && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              disabled={cancelStatus.loading && cancelStatus.id === reservation.id}
                              className={`mt-2 px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600 transition-colors ${
                                (cancelStatus.loading && cancelStatus.id === reservation.id) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                            >
                              {cancelStatus.loading && cancelStatus.id === reservation.id
                                ? 'キャンセル中...'
                                : 'キャンセルする'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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

export default ReservationHistory; 