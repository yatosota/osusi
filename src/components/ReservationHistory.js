import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import LoadingSpinner from './common/LoadingSpinner';
import PageLayout from './common/PageLayout';

// 予約ステータスの定義
const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  MODIFIED: 'modified',
  EXPIRED: 'expired'
};

// ステータスの表示名
const STATUS_DISPLAY = {
  [RESERVATION_STATUS.CONFIRMED]: { text: '予約確定', class: 'bg-green-100 text-green-800' },
  [RESERVATION_STATUS.CANCELLED]: { text: 'キャンセル済み', class: 'bg-red-100 text-red-800' },
  [RESERVATION_STATUS.MODIFIED]: { text: '変更済み', class: 'bg-yellow-100 text-yellow-800' },
  [RESERVATION_STATUS.EXPIRED]: { text: '期限切れ', class: 'bg-gray-100 text-gray-800' }
};

// 日付を安全に変換する関数
const safeConvertDate = (dateData) => {
  try {
    // nullやundefinedの場合
    if (!dateData) {
      console.warn('日付データがnullまたはundefinedです');
      return null;
    }
    
    // すでにDateオブジェクトの場合
    if (dateData instanceof Date) {
      return dateData;
    }
    
    // Firestoreのタイムスタンプの場合
    if (typeof dateData.toDate === 'function') {
      return dateData.toDate();
    }
    
    // seconds, nanosecondsプロパティを持つオブジェクトの場合（Firestoreタイムスタンプの生データ）
    if (dateData.seconds !== undefined && dateData.nanoseconds !== undefined) {
      return new Date(dateData.seconds * 1000 + dateData.nanoseconds / 1000000);
    }
    
    // secondsプロパティのみを持つオブジェクトの場合
    if (dateData.seconds !== undefined) {
      return new Date(dateData.seconds * 1000);
    }
    
    // 数値型（ミリ秒）の場合
    if (typeof dateData === 'number') {
      return new Date(dateData);
    }
    
    // 文字列の場合
    if (typeof dateData === 'string') {
      const parsedDate = new Date(dateData);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    // その他の形式の場合はログを残す
    console.warn('不明な日付形式:', dateData);
    return null;
  } catch (error) {
    console.error('日付の変換に失敗:', error);
    return null;
  }
};

// 日付フォーマットのユーティリティ関数
const formatDateWithTime = (dateValue) => {
  if (!dateValue) return '';

  try {
    const date = safeConvertDate(dateValue);
    if (!date) return '';

    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

// 予約日付のみのフォーマット（時刻なし）
const formatDateOnly = (dateValue) => {
  if (!dateValue) return '';

  try {
    const date = safeConvertDate(dateValue);
    if (!date) return '';

    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return '';
  }
};

const ReservationHistory = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReservationHistory = async () => {
      if (!currentUser) return;
      
      try {
        const reservationsRef = collection(db, 'reservations');
        const q = query(
          reservationsRef,
          where('userId', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const reservationData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          // 日付を安全に変換
          const reservationDate = data.date ? safeConvertDate(data.date) : null;
          
          return {
            id: doc.id,
            ...data,
            dateConverted: reservationDate, // 変換済みの日付を保存
            uniqueKey: `${doc.id}-${data.status || 'default'}-${Date.now()}` // ユニークなキーを生成
          };
        }).filter(reservation => reservation.dateConverted !== null); // 無効な日付の予約を除外

        // 重複を除去（同じIDの予約は最新のものだけを残す）
        const uniqueReservations = reservationData.reduce((acc, current) => {
          const existingReservation = acc.find(item => item.id === current.id);
          if (!existingReservation) {
            acc.push(current);
          } else if (current.modifiedAt && (!existingReservation.modifiedAt || 
            safeConvertDate(current.modifiedAt) > safeConvertDate(existingReservation.modifiedAt))) {
            // 変更された予約は新しい方を残す
            const index = acc.findIndex(item => item.id === current.id);
            acc[index] = current;
          }
          return acc;
        }, []);

        // 日付でソート
        uniqueReservations.sort((a, b) => {
          const dateA = a.dateConverted || new Date(0);
          const dateB = b.dateConverted || new Date(0);
          return dateB - dateA; // 降順（新しい順）
        });

        console.log('取得した予約履歴:', uniqueReservations.length, '件');
        setReservations(uniqueReservations);
      } catch (error) {
        console.error('Error fetching reservation history:', error);
        setError('予約履歴の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchReservationHistory();
  }, [currentUser]);

  if (loading) {
    return (
      <PageLayout centerContent>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">予約履歴</h1>
          <p className="mt-2 text-sm text-gray-600">過去の予約内容を確認できます</p>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">予約履歴はありません</p>
            <button
              onClick={() => navigate('/new-reservation')}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              新規予約を作成
            </button>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {reservations.map((reservation) => (
                <li key={reservation.uniqueKey} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col flex-grow">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-blue-600">
                            {formatDateOnly(reservation.dateConverted)} {reservation.time}
                          </p>
                          <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_DISPLAY[reservation.status]?.class || STATUS_DISPLAY[RESERVATION_STATUS.CONFIRMED].class}`}>
                            {STATUS_DISPLAY[reservation.status]?.text || STATUS_DISPLAY[RESERVATION_STATUS.CONFIRMED].text}
                          </span>
                        </div>
                        <div className="mt-2">
                          <p className="text-sm text-gray-900">
                            {reservation.numberOfPeople}名様 / {reservation.course === 'standard' ? 'スタンダード' : 'プレミアム'}コース
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.seatType === 'counter' ? 'カウンター席' : 
                             reservation.seatType === 'table' ? 'テーブル席' : '個室'}
                          </p>
                          {reservation.createdAt && (
                            <p className="text-sm text-gray-500 mt-1">
                              予約日時: {formatDateWithTime(reservation.createdAt)}
                            </p>
                          )}
                          {reservation.cancelledAt && (
                            <p className="text-sm text-red-600 mt-1">
                              キャンセル日時: {formatDateWithTime(reservation.cancelledAt)}
                            </p>
                          )}
                          {reservation.modifiedAt && (
                            <p className="text-sm text-yellow-600 mt-1">
                              変更日時: {formatDateWithTime(reservation.modifiedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            現在の予約状況に戻る
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default ReservationHistory; 