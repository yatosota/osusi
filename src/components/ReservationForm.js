import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

const ReservationForm = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedSeatType, setSelectedSeatType] = useState('counter');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    nameKana: '',
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // 営業時間の設定
  const timeSlots = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00', '21:30'
  ];

  // 週の日付を生成
  const weekDays = [...Array(7)].map((_, index) => {
    return addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), index);
  });

  // 前の週へ
  const previousWeek = () => {
    setCurrentWeek(prev => addDays(prev, -7));
  };

  // 次の週へ
  const nextWeek = () => {
    setCurrentWeek(prev => addDays(prev, 7));
  };

  // テスト用：すべての時間枠を予約可能に
  const isAvailable = () => true;

  // 日付と時間の選択
  const handleTimeSlotClick = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

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
        numberOfPeople,
        seatType: selectedSeatType,
        customerInfo,
        userId,
        isGuest: !!guestUser
      };
      sessionStorage.setItem('reservationData', JSON.stringify(reservationData));

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
        <h2 className="text-2xl font-bold mb-6 text-gray-900">ご予約</h2>
        
        {/* プログレスバー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                selectedDate && selectedTime ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}>
                1
              </div>
              <div className="ml-2">日時選択</div>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-1 ${
                selectedDate && selectedTime ? 'bg-indigo-600' : ''
              }`} style={{ width: selectedDate && selectedTime ? '100%' : '0%' }}></div>
            </div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                selectedSeatType && numberOfPeople ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}>
                2
              </div>
              <div className="ml-2">席・人数</div>
            </div>
            <div className="flex-1 h-1 mx-4 bg-gray-200">
              <div className={`h-1 ${
                isFormComplete() ? 'bg-indigo-600' : ''
              }`} style={{ width: isFormComplete() ? '100%' : '0%' }}></div>
            </div>
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                isFormComplete() ? 'bg-indigo-600 text-white' : 'bg-gray-200'
              }`}>
                3
              </div>
              <div className="ml-2">個人情報</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 日時選択セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">1. 日時の選択</h3>
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={previousWeek}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                前の週
              </button>
              <span className="text-lg font-semibold">
                {format(weekDays[0], 'M月d日', { locale: ja })} - 
                {format(weekDays[6], 'M月d日', { locale: ja })}
              </span>
              <button
                type="button"
                onClick={nextWeek}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                次の週
              </button>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {/* 時間枠の列 */}
              <div className="col-span-1">
                <div className="h-10"></div>
                {timeSlots.map(time => (
                  <div key={time} className="h-10 flex items-center justify-end pr-2 text-sm text-gray-600">
                    {time}
                  </div>
                ))}
              </div>

              {/* 日付と予約枠 */}
              {weekDays.map(day => (
                <div key={day.toString()} className="col-span-1">
                  <div className="h-10 text-center font-semibold p-2 bg-gray-100">
                    {format(day, 'd\nE', { locale: ja })}
                  </div>
                  {timeSlots.map(time => {
                    const isSelected = selectedDate && selectedTime &&
                      isSameDay(day, selectedDate) && time === selectedTime;

                    return (
                      <button
                        type="button"
                        key={`${day}-${time}`}
                        onClick={() => handleTimeSlotClick(day, time)}
                        className={`
                          h-10 w-full border rounded
                          ${isSelected ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-100'}
                        `}
                      >
                        ○
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </section>

          {/* 席タイプと人数選択セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">2. 席タイプと人数の選択</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  席タイプ
                </label>
                <select
                  value={selectedSeatType}
                  onChange={(e) => setSelectedSeatType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="counter">カウンター席</option>
                  <option value="table">テーブル席</option>
                  <option value="private">個室</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  人数
                </label>
                <select
                  value={numberOfPeople}
                  onChange={(e) => setNumberOfPeople(Number(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                  {[...Array(8)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}名</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 個人情報入力セクション */}
          <section className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">3. お客様情報の入力</h3>
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
                  お名前（フリガナ）
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

          {/* 予約ボタン */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!isFormComplete() || loading}
              className={`
                px-6 py-3 rounded-md text-white font-medium
                ${isFormComplete() && !loading
                  ? 'bg-indigo-600 hover:bg-indigo-700'
                  : 'bg-gray-400 cursor-not-allowed'}
              `}
            >
              {loading ? '処理中...' : '予約内容の確認へ進む'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationForm; 