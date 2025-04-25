import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const ConfirmationPage = () => {
  const navigate = useNavigate();
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservationDetails = async () => {
      try {
        // セッションストレージから予約IDを取得
        const reservationId = sessionStorage.getItem('currentReservationId');
        if (!reservationId) {
          navigate('/reservations');
          return;
        }

        // Firestoreから予約データを取得
        const reservationDoc = await getDoc(doc(db, 'reservations', reservationId));
        if (reservationDoc.exists()) {
          const data = reservationDoc.data();
          // 日付データを適切に変換
          const date = data.date.toDate();
          setReservation({
            ...data,
            date,
            // 予約番号をシンプルな形式に変更（例：R0001）
            displayId: `R${String(parseInt(reservationId.slice(-4), 16)).padStart(4, '0')}`
          });
        } else {
          console.error('予約が見つかりません');
          navigate('/reservations');
        }
      } catch (error) {
        console.error('予約データの取得に失敗しました:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservationDetails();
  }, [navigate]);

  // 日付と時間のフォーマット
  const formatDateTime = (date) => {
    if (!date) return '';
    return format(date, 'yyyy年M月d日(E) HH:mm', { locale: ja });
  };

  // 座席タイプの日本語表示
  const getSeatTypeName = (seatType) => {
    const seatTypes = {
      counter: 'カウンター席',
      table: 'テーブル席',
      private: '個室'
    };
    return seatTypes[seatType] || seatType;
  };

  // コースタイプの日本語表示
  const getCourseTypeName = (courseType) => {
    const courseTypes = {
      takumi: '匠（たくみ）コース',
      miyabi: '雅（みやび）コース'
    };
    return courseTypes[courseType] || courseType;
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-500 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">予約完了</h2>
        </div>
        
        <div className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <svg className="h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-center text-gray-600">ご予約ありがとうございます。以下の内容で予約を承りました。</p>
          </div>

          <div className="border-t border-gray-200 py-4">
            <dl>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">予約番号</dt>
                <dd className="text-sm text-gray-900 col-span-2">{reservation.displayId}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">予約日時</dt>
                <dd className="text-sm text-gray-900 col-span-2">{formatDateTime(reservation.date)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">人数</dt>
                <dd className="text-sm text-gray-900 col-span-2">{reservation.numberOfPeople}名</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">座席タイプ</dt>
                <dd className="text-sm text-gray-900 col-span-2">{getSeatTypeName(reservation.seatType)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">コース</dt>
                <dd className="text-sm text-gray-900 col-span-2">{getCourseTypeName(reservation.courseType)}</dd>
              </div>
              <div className="grid grid-cols-3 gap-4 py-3">
                <dt className="text-sm font-medium text-gray-500">お支払い金額</dt>
                <dd className="text-sm text-gray-900 col-span-2">¥{reservation.totalAmount.toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => navigate('/')}
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              ホームへ戻る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationPage; 