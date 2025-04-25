import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, orderBy, getDoc } from 'firebase/firestore';
import LoadingSpinner from './common/LoadingSpinner';
import PageLayout from './common/PageLayout';

// 予約ステータスの定義
const RESERVATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  MODIFIED: 'modified',
  EXPIRED: 'expired'
};

// 重複削除用のユーティリティ関数
const removeDuplicateById = (array) => {
  const seen = new Set();
  return array.filter(item => {
    const duplicate = seen.has(item.id);
    seen.add(item.id);
    return !duplicate;
  });
};

const CurrentReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // 安全なキー生成（重複しないようにする）
  const generateUniqueKey = useCallback((id, suffix = '') => {
    return `${id}-${suffix}-${Math.random().toString(36).substring(2, 10)}`;
  }, []);

  // 日付を安全に変換する関数
  const safeConvertDate = useCallback((dateData) => {
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
  }, []);

  // 予約データの取得
  const fetchReservations = useCallback(async () => {
    if (!currentUser) {
      setError('ユーザー情報が取得できません。');
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log('予約データを取得中...');

    try {
      // 現在日時の取得
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      // より単純で確実なアプローチ
      const reservationsRef = collection(db, 'reservations');
      
      // 明示的に確定済みの予約のみを取得
      const confirmedQuery = query(
        reservationsRef,
        where('userId', '==', currentUser.uid),
        where('status', '==', RESERVATION_STATUS.CONFIRMED),
        where('date', '>=', currentDate)
      );
      
      const querySnapshot = await getDocs(confirmedQuery);
      console.log(`確定済みの予約データ: ${querySnapshot.size}件`);
      
      // データ変換
      let confirmedReservations = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const reservationDate = safeConvertDate(data.date);
        
        // 日付が無効な場合は除外
        if (!reservationDate) return null;
        
        return {
          id: doc.id,
          ...data,
          dateConverted: reservationDate,
          // IDから生成する一意のキー - Math.randomは使わない
          uniqueKey: `${doc.id}-${data.status || 'confirmed'}`
        };
      }).filter(Boolean); // nullを除外
      
      // 重複IDがあれば排除する（念のため）
      confirmedReservations = removeDuplicateById(confirmedReservations);
      
      // 日付と時間でソート
      confirmedReservations.sort((a, b) => {
        // 日付比較
        if (a.dateConverted.getTime() !== b.dateConverted.getTime()) {
          return a.dateConverted - b.dateConverted;
        }
        
        // 同じ日付の場合は時間で比較
        return (a.time || '').localeCompare(b.time || '');
      });
      
      // 確認のためにすべてのIDをログ出力
      console.log(`有効な予約: ${confirmedReservations.length}件`);
      console.log('予約ID一覧:', confirmedReservations.map(r => r.id).join(', '));
      
      // 重複がないことを確認
      const ids = confirmedReservations.map(r => r.id);
      const uniqueIds = [...new Set(ids)];
      if (ids.length !== uniqueIds.length) {
        console.warn('重複IDが検出されました！', 
          ids.filter((id, index) => ids.indexOf(id) !== index));
      } else {
        console.log('重複IDはありません - 正常に処理されました');
      }
      
      setReservations(confirmedReservations);
      setError(null);
    } catch (error) {
      console.error('予約データの取得中にエラーが発生しました:', error);
      setError('予約データの取得に失敗しました。');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, safeConvertDate]);

  // コンポーネントマウント時に予約データを取得
  useEffect(() => {
    if (currentUser) {
      fetchReservations();
    }
  }, [currentUser, fetchReservations]);

  // 予約キャンセル処理
  const handleCancel = useCallback(async (reservationId) => {
    try {
      const isConfirmed = window.confirm('予約をキャンセルしてもよろしいですか？\nキャンセル後の変更はできません。');
      
      if (isConfirmed) {
        setLoading(true);
        console.log(`予約 ${reservationId} をキャンセル処理中...`);

        try {
          // まず予約ドキュメントを取得して存在確認
          const reservationRef = doc(db, 'reservations', reservationId);
          const reservationSnapshot = await getDoc(reservationRef);
          
          if (!reservationSnapshot.exists()) {
            throw new Error('予約データが見つかりません');
          }
          
          // Firestoreの更新
          await updateDoc(reservationRef, {
            status: RESERVATION_STATUS.CANCELLED,
            cancelledAt: serverTimestamp()
          });

          console.log(`予約 ${reservationId} をキャンセル済みに更新しました`);
          
          // UIからも削除
          setReservations(prev => prev.filter(r => r.id !== reservationId));
          
          alert('予約をキャンセルしました。');
        } catch (error) {
          console.error('予約のキャンセルに失敗しました:', error);
          alert('予約のキャンセルに失敗しました。もう一度お試しください。');
          // エラー時にデータを再取得
          await fetchReservations();
        } finally {
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('予約キャンセル処理エラー:', error);
      alert('予期せぬエラーが発生しました。ページを更新してお試しください。');
      setLoading(false);
    }
  }, [fetchReservations]);

  // 予約変更処理
  const handleEdit = useCallback(async (reservationId) => {
    try {
      const reservation = reservations.find(r => r.id === reservationId);
      if (!reservation) {
        alert('予約データが見つかりません。');
        return;
      }

      setLoading(true);

      try {
        // まず予約ドキュメントを取得して存在確認
        const reservationRef = doc(db, 'reservations', reservationId);
        const reservationSnapshot = await getDoc(reservationRef);
        
        if (!reservationSnapshot.exists()) {
          throw new Error('予約データが見つかりません');
        }
        
        // Firestoreの更新
        await updateDoc(reservationRef, {
          status: RESERVATION_STATUS.MODIFIED,
          modifiedAt: serverTimestamp()
        });

        console.log(`予約 ${reservationId} を変更済みに更新しました`);
        
        // UIからも削除
        setReservations(prev => prev.filter(r => r.id !== reservationId));

        // 予約データをセッションストレージに保存
        sessionStorage.setItem('editReservationData', JSON.stringify(reservation));
        
        // 新規予約ページに遷移
        navigate('/new-reservation');
      } catch (error) {
        console.error('予約の変更に失敗しました:', error);
        alert('予約の変更に失敗しました。もう一度お試しください。');
        await fetchReservations();
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('予約変更処理エラー:', error);
      alert('予期せぬエラーが発生しました。ページを更新してお試しください。');
      setLoading(false);
    }
  }, [reservations, navigate, fetchReservations]);

  // エラー表示
  if (error) {
    return (
      <PageLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchReservations();
            }}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            再読み込み
          </button>
        </div>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout centerContent>
        <LoadingSpinner />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">現在の予約状況</h1>
          <p className="mt-2 text-sm text-gray-600">これからの予約内容を確認・変更できます</p>
        </div>

        {reservations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">現在の予約はありません</p>
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
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-blue-600">
                          {reservation.dateConverted.toLocaleDateString('ja-JP')} {reservation.time}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm text-gray-900">
                            {reservation.numberOfPeople}名様 / {reservation.course === 'standard' ? 'スタンダード' : 'プレミアム'}コース
                          </p>
                          <p className="text-sm text-gray-600">
                            {reservation.seatType === 'counter' ? 'カウンター席' : 
                             reservation.seatType === 'table' ? 'テーブル席' : '個室'}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(reservation.id)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                          変更
                        </button>
                        <button
                          onClick={() => handleCancel(reservation.id)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
                        >
                          キャンセル
                        </button>
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
            onClick={() => navigate('/reservation-history')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            予約履歴を確認
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default CurrentReservations; 