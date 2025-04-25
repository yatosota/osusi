import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaClock } from 'react-icons/fa';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// 日付選択コンポーネントをメモ化
const MemoizedDatePicker = memo(({ selectedDate, onChange }) => {
  return (
    <div className="relative">
      <DatePicker
        selected={selectedDate}
        onChange={onChange}
        dateFormat="yyyy/MM/dd"
        minDate={new Date()}
        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
      <FaCalendarAlt className="absolute right-3 top-3 text-gray-400" />
    </div>
  );
});

// 時間選択コンポーネントをメモ化
const MemoizedTimeSelector = memo(({ selectedTime, showTimeSelect, toggleTimeSelect, handleTimeSelect, timeSlots }) => {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleTimeSelect}
        className="w-full text-left rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {selectedTime || '時間を選択'}
        <FaClock className="absolute right-3 top-3 text-gray-400" />
      </button>
      {showTimeSelect && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {timeSlots.map(time => (
            <button
              key={time}
              type="button"
              onClick={() => handleTimeSelect(time)}
              className="block w-full px-4 py-2 text-left hover:bg-gray-100"
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

// 席タイプ選択コンポーネントをメモ化
const MemoizedSeatTypeSelector = memo(({ selectedSeatType, onChange }) => {
  return (
    <select
      value={selectedSeatType}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      <option value="counter">カウンター席 (追加料金なし)</option>
      <option value="table">テーブル席 (+¥500/人)</option>
      <option value="private">個室 (+¥2,000/人)</option>
    </select>
  );
});

// 人数選択コンポーネントをメモ化
const MemoizedPeopleSelector = memo(({ numberOfPeople, onChange }) => {
  return (
    <select
      value={numberOfPeople}
      onChange={onChange}
      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
    >
      {[...Array(8)].map((_, i) => (
        <option key={i + 1} value={i + 1}>{i + 1}名</option>
      ))}
    </select>
  );
});

// コース選択コンポーネントをメモ化
const MemoizedCourseSelector = memo(({ courses, selectedCourse, onCourseSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      {Object.entries(courses).map(([id, course]) => (
        <div
          key={id}
          className={`border rounded-lg p-4 cursor-pointer ${
            selectedCourse === id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'
          }`}
          onClick={() => onCourseSelect(id)}
        >
          <h4 className="font-medium text-lg">{course.name}</h4>
          <p className="text-gray-600 text-sm mt-1">{course.description}</p>
          <p className="text-indigo-600 font-medium mt-2">¥{course.price.toLocaleString()}/人</p>
        </div>
      ))}
    </div>
  );
});

const ReservationForm = () => {
  // useRefを使用して初回レンダリングをトラッキング
  const initialRenderRef = useRef(true);
  const editDataProcessedRef = useRef(false);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeatType, setSelectedSeatType] = useState('counter');
  const [selectedCourse, setSelectedCourse] = useState('standard');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [showTimeSelect, setShowTimeSelect] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    nameKana: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();

  // 編集データの読み込み - 初回のみ実行
  useEffect(() => {
    // 既に処理済みの場合は何もしない
    if (editDataProcessedRef.current) return;
    
    // 編集データの処理フラグを設定
    editDataProcessedRef.current = true;
    
    const loadEditData = () => {
      const editData = sessionStorage.getItem('editReservationData');
      if (editData) {
        try {
          const parsedData = JSON.parse(editData);
          
          // 一度にすべての状態を更新
          const updates = {};
          
          if (parsedData.date && parsedData.date.seconds) {
            updates.selectedDate = new Date(parsedData.date.seconds * 1000);
          }
          
          if (parsedData.time) updates.selectedTime = parsedData.time;
          if (parsedData.seatType) updates.selectedSeatType = parsedData.seatType;
          if (parsedData.course) updates.selectedCourse = parsedData.course;
          if (parsedData.numberOfPeople) updates.numberOfPeople = parsedData.numberOfPeople;
          
          if (parsedData.customerInfo) {
            updates.customerInfo = parsedData.customerInfo;
          }
          
          // すべての状態を一度に更新
          if (updates.selectedDate) setSelectedDate(updates.selectedDate);
          if (updates.selectedTime) setSelectedTime(updates.selectedTime);
          if (updates.selectedSeatType) setSelectedSeatType(updates.selectedSeatType);
          if (updates.selectedCourse) setSelectedCourse(updates.selectedCourse);
          if (updates.numberOfPeople) setNumberOfPeople(updates.numberOfPeople);
          if (updates.customerInfo) setCustomerInfo(updates.customerInfo);
          
          setIsEditing(true);
          
          // 編集データを使用したら削除
          sessionStorage.removeItem('editReservationData');
          console.log('編集データを読み込みました');
        } catch (error) {
          console.error('編集データの解析に失敗しました:', error);
        }
      } else if (currentUser && !currentUser.isGuest) {
        // ユーザー情報の設定は一度だけ
        setCustomerInfo({
          name: currentUser.name || '',
          nameKana: currentUser.nameKana || '',
          phone: currentUser.phone || '',
          email: currentUser.email || ''
        });
        console.log('ユーザー情報を設定しました');
      }
    };
    
    if (!authLoading) {
      loadEditData();
    }
  }, [currentUser, authLoading]); // 依存配列を最小限に

  // コースの定義
  const courses = {
    standard: {
      name: 'スタンダードコース',
      description: '季節の食材を使用した基本的なコース',
      price: 8000
    },
    premium: {
      name: 'プレミアムコース',
      description: '厳選された高級食材を使用した特別コース',
      price: 12000
    }
  };

  // 席タイプごとの追加料金
  const seatPrices = {
    counter: 0,
    table: 500,
    private: 2000
  };

  // 営業時間の設定
  const timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30'
  ];

  // 合計金額の計算
  const calculateTotalPrice = () => {
    const basePrice = courses[selectedCourse].price;
    const seatPrice = seatPrices[selectedSeatType];
    return (basePrice + seatPrice) * numberOfPeople;
  };

  // コールバックをメモ化
  const toggleTimeSelect = useCallback(() => {
    setShowTimeSelect(prev => !prev);
  }, []);

  const handleTimeSelect = useCallback((time) => {
    setSelectedTime(time);
    setShowTimeSelect(false);
  }, []);

  const handleSeatTypeChange = useCallback((e) => {
    setSelectedSeatType(e.target.value);
  }, []);

  const handlePeopleChange = useCallback((e) => {
    setNumberOfPeople(Number(e.target.value));
  }, []);

  // 顧客情報の更新
  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setCustomerInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // フォームが完全に入力されているかチェック
  const isFormComplete = () => {
    return selectedDate && 
           selectedTime && 
           customerInfo.name && 
           customerInfo.nameKana && 
           customerInfo.phone && 
           customerInfo.email;
  };

  // 日付選択のコールバックをメモ化
  const handleDateChange = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  // コース選択のコールバックをメモ化
  const handleCourseSelect = useCallback((courseId) => {
    setSelectedCourse(courseId);
  }, []);

  // 予約フォームの送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormComplete()) {
      alert('すべての必須項目を入力してください。');
      return;
    }
    setLoading(true);

    try {
      const guestUser = JSON.parse(sessionStorage.getItem('guestUser'));
      const userId = currentUser ? currentUser.uid : guestUser?.guestId;

      const reservationData = {
        date: selectedDate,
        time: selectedTime,
        course: selectedCourse,
        numberOfPeople,
        seatType: selectedSeatType,
        totalPrice: calculateTotalPrice(),
        customerInfo,
        userId,
        isGuest: !!guestUser,
        status: 'confirmed',
        createdAt: serverTimestamp()
      };

      // 新規予約をFirestoreに追加
      const docRef = await addDoc(collection(db, 'reservations'), reservationData);
      
      // 予約データをセッションストレージに保存
      sessionStorage.setItem('reservationData', JSON.stringify({
        ...reservationData,
        id: docRef.id
      }));

      navigate('/payment');
    } catch (error) {
      console.error('Reservation error:', error);
      alert('予約処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          {isEditing ? '予約内容の変更' : 'ご予約'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* コース選択セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">1. コースの選択</h3>
            <MemoizedCourseSelector 
              courses={courses}
              selectedCourse={selectedCourse}
              onCourseSelect={handleCourseSelect}
            />
          </section>

          {/* 日時選択セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2. 日時の選択</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予約日
                </label>
                <MemoizedDatePicker
                  selectedDate={selectedDate}
                  onChange={handleDateChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  予約時間
                </label>
                <MemoizedTimeSelector
                  selectedTime={selectedTime}
                  showTimeSelect={showTimeSelect}
                  toggleTimeSelect={toggleTimeSelect}
                  handleTimeSelect={handleTimeSelect}
                  timeSlots={timeSlots}
                />
              </div>
            </div>
          </section>

          {/* 席タイプと人数選択セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">3. 席タイプと人数の選択</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  席タイプ
                </label>
                <MemoizedSeatTypeSelector
                  selectedSeatType={selectedSeatType}
                  onChange={handleSeatTypeChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  人数
                </label>
                <MemoizedPeopleSelector
                  numberOfPeople={numberOfPeople}
                  onChange={handlePeopleChange}
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-lg font-medium">予約内容</p>
              <p className="mt-2">
                {courses[selectedCourse].name}: ¥{courses[selectedCourse].price.toLocaleString()}/人
                {seatPrices[selectedSeatType] > 0 && ` + 席料: ¥${seatPrices[selectedSeatType].toLocaleString()}/人`}
              </p>
              <p className="mt-1">
                合計金額: ¥{calculateTotalPrice().toLocaleString()} ({numberOfPeople}名様)
              </p>
            </div>
          </section>

          {/* 個人情報入力セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">4. お客様情報</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  お名前
                </label>
                <input
                  type="text"
                  name="name"
                  value={customerInfo.name}
                  onChange={handleCustomerInfoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  フリガナ
                </label>
                <input
                  type="text"
                  name="nameKana"
                  value={customerInfo.nameKana}
                  onChange={handleCustomerInfoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス
                </label>
                <input
                  type="email"
                  name="email"
                  value={customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
            </div>
          </section>

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading || !isFormComplete()}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                loading || !isFormComplete()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {loading ? '処理中...' : isEditing ? '予約を変更する' : '予約する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm; 