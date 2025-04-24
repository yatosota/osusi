import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { saveReservation } from '../utils/firestore';
import { Timestamp } from 'firebase/firestore';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

const PaymentPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reservationData, setReservationData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [errors, setErrors] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const data = sessionStorage.getItem('reservationData');
    if (!data) {
      navigate('/reservations');
      return;
    }
    setReservationData(JSON.parse(data));
  }, [navigate]);

  // カード番号のフォーマット (4桁ごとにスペースを追加)
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // 有効期限のフォーマット (MM/YY)
  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  // 入力値の検証
  const validateCardInfo = () => {
    const newErrors = {
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    };
    let isValid = true;

    // カード番号の検証
    const cardNumber = cardInfo.number.replace(/\s+/g, '');
    if (!cardNumber) {
      newErrors.number = 'カード番号を入力してください';
      isValid = false;
    } else if (cardNumber.length !== 16) {
      newErrors.number = 'カード番号は16桁で入力してください';
      isValid = false;
    }

    // 有効期限の検証
    const expiry = cardInfo.expiry.replace(/[^\d]/g, '');
    if (!expiry) {
      newErrors.expiry = '有効期限を入力してください';
      isValid = false;
    } else if (expiry.length !== 4) {
      newErrors.expiry = '有効期限を正しく入力してください';
      isValid = false;
    } else {
      const month = parseInt(expiry.substring(0, 2), 10);
      const year = parseInt(expiry.substring(2, 4), 10);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;

      if (month < 1 || month > 12) {
        newErrors.expiry = '有効な月を入力してください';
        isValid = false;
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiry = 'カードの有効期限が切れています';
        isValid = false;
      }
    }

    // セキュリティコードの検証
    if (!cardInfo.cvc) {
      newErrors.cvc = 'セキュリティコードを入力してください';
      isValid = false;
    } else if (cardInfo.cvc.length !== 3 && cardInfo.cvc.length !== 4) {
      newErrors.cvc = 'セキュリティコードは3桁または4桁で入力してください';
      isValid = false;
    }

    // カード名義の検証
    if (!cardInfo.name) {
      newErrors.name = 'カード名義を入力してください';
      isValid = false;
    } else if (!/^[A-Z\s]+$/.test(cardInfo.name.toUpperCase())) {
      newErrors.name = 'カード名義は半角英字で入力してください';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleCardInfoChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // 入力値のフォーマット
    switch (name) {
      case 'number':
        formattedValue = formatCardNumber(value);
        if (formattedValue.length > 19) return; // 16桁 + 3つのスペース
        break;
      case 'expiry':
        formattedValue = formatExpiry(value);
        if (formattedValue.length > 5) return; // MM/YY
        break;
      case 'cvc':
        formattedValue = value.replace(/[^\d]/g, '');
        if (formattedValue.length > 4) return;
        break;
      case 'name':
        formattedValue = value.toUpperCase();
        break;
      default:
        break;
    }

    setCardInfo(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // エラーメッセージをクリア
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const handleConfirmation = (e) => {
    e.preventDefault();

    // クレジットカード支払いの場合の検証
    if (paymentMethod === 'credit') {
      if (!cardInfo.number || !cardInfo.expiry || !cardInfo.cvc || !cardInfo.name) {
        alert('クレジットカード情報を全て入力してください。');
        return;
      }
    }

    // 予約データの準備
    const reservationDataToConfirm = {
      ...reservationData,
      paymentMethod,
      paymentStatus: paymentMethod === 'credit' ? 'paid' : 'pending',
      totalAmount: calculateTotalAmount(reservationData),
      cardInfo: paymentMethod === 'credit' ? {
        lastFourDigits: cardInfo.number.slice(-4),
        nameOnCard: cardInfo.name
      } : null
    };

    // 確認用データをセッションストレージに保存
    sessionStorage.setItem('reservationConfirmData', JSON.stringify(reservationDataToConfirm));
    setShowConfirmation(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (paymentMethod === 'credit' && !validateCardInfo()) {
      return;
    }

    setIsProcessing(true);

    try {
      // 予約データを取得
      const reservationData = JSON.parse(sessionStorage.getItem('reservationData'));
      
      // 日付をTimestampに変換
      const reservationDate = new Date(reservationData.date);
      
      // 予約データを準備
      const reservationDataToSave = {
        ...reservationData,
        date: Timestamp.fromDate(reservationDate),
        paymentStatus: 'completed',
        paymentMethod: paymentMethod,
        cardInfo: paymentMethod === 'credit' ? {
          lastFourDigits: cardInfo.number.replace(/\s+/g, '').slice(-4),
          nameOnCard: cardInfo.name
        } : null,
        totalAmount: calculateTotalAmount(reservationData),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: 'confirmed'
      };

      // Firestoreに保存
      const reservationRef = await addDoc(collection(db, 'reservations'), reservationDataToSave);
      
      // 予約IDをセッションストレージに保存
      sessionStorage.setItem('currentReservationId', reservationRef.id);
      
      // セッションストレージから一時データを削除
      sessionStorage.removeItem('reservationData');
      
      // 確認画面に遷移
      navigate('/confirmation');
    } catch (error) {
      console.error('Reservation error:', error);
      setError('予約処理中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 料金計算関数
  const calculateTotalAmount = (data) => {
    const basePrices = {
      counter: 5000,
      table: 6000,
      private: 8000
    };
    const basePrice = basePrices[data.seatType];
    return basePrice * data.numberOfPeople;
  };

  if (!reservationData) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const totalAmount = calculateTotalAmount(reservationData);

  if (showConfirmation) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50">
            <h2 className="text-xl font-bold text-gray-900">予約内容の最終確認</h2>
            <p className="mt-2 text-sm text-gray-600">以下の内容で予約を確定します。</p>
          </div>
          
          <div className="px-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">予約情報</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">日時：</span>
                    {format(new Date(reservationData.date), 'yyyy年M月d日(E)', { locale: ja })} {reservationData.time}
                  </p>
                  <p>
                    <span className="font-medium">席タイプ：</span>
                    {reservationData.seatType === 'counter' ? 'カウンター席' :
                     reservationData.seatType === 'table' ? 'テーブル席' : '個室'}
                  </p>
                  <p>
                    <span className="font-medium">人数：</span>
                    {reservationData.numberOfPeople}名
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">お客様情報</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">お名前：</span>
                    {reservationData.customerInfo.name}（{reservationData.customerInfo.nameKana}）
                  </p>
                  <p>
                    <span className="font-medium">電話番号：</span>
                    {reservationData.customerInfo.phone}
                  </p>
                  <p>
                    <span className="font-medium">メールアドレス：</span>
                    {reservationData.customerInfo.email}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">お支払い情報</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">支払い方法：</span>
                    {paymentMethod === 'credit' ? 'クレジットカード' : '現地支払い'}
                  </p>
                  {paymentMethod === 'credit' && (
                    <p>
                      <span className="font-medium">カード番号：</span>
                      ****-****-****-{cardInfo.number.slice(-4)}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">お支払い金額：</span>
                    ¥{totalAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                修正する
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`
                  px-6 py-2 rounded-md text-white font-medium
                  ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
              >
                {loading ? '処理中...' : '予約を確定する'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 予約内容の確認 */}
        <div className="px-6 py-4 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">予約内容の確認</h2>
          <div className="mt-4 space-y-2">
            <p>
              <span className="font-medium">日時：</span>
              {format(new Date(reservationData.date), 'yyyy年M月d日(E)', { locale: ja })} {reservationData.time}
            </p>
            <p>
              <span className="font-medium">席タイプ：</span>
              {reservationData.seatType === 'counter' ? 'カウンター席' :
               reservationData.seatType === 'table' ? 'テーブル席' : '個室'}
            </p>
            <p>
              <span className="font-medium">人数：</span>
              {reservationData.numberOfPeople}名
            </p>
            <p>
              <span className="font-medium">お名前：</span>
              {reservationData.customerInfo.name}（{reservationData.customerInfo.nameKana}）
            </p>
            <p>
              <span className="font-medium">電話番号：</span>
              {reservationData.customerInfo.phone}
            </p>
            <p>
              <span className="font-medium">メールアドレス：</span>
              {reservationData.customerInfo.email}
            </p>
          </div>
        </div>

        {/* 支払い情報入力フォーム */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">お支払い情報</h3>
          
          {/* 支払い方法の選択 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              支払い方法
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="credit"
                  checked={paymentMethod === 'credit'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2">クレジットカード</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2">現地支払い（現金）</span>
              </label>
            </div>
          </div>

          {/* クレジットカード情報フォーム */}
          {paymentMethod === 'credit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カード番号
                </label>
                <input
                  type="text"
                  name="number"
                  value={cardInfo.number}
                  onChange={handleCardInfoChange}
                  placeholder="1234 5678 9012 3456"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.number ? 'border-red-300' : 'border-gray-300'
                  }`}
                  maxLength="19"
                />
                {errors.number && (
                  <p className="mt-1 text-sm text-red-600">{errors.number}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    有効期限
                  </label>
                  <input
                    type="text"
                    name="expiry"
                    value={cardInfo.expiry}
                    onChange={handleCardInfoChange}
                    placeholder="MM/YY"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.expiry ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength="5"
                  />
                  {errors.expiry && (
                    <p className="mt-1 text-sm text-red-600">{errors.expiry}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    セキュリティコード
                  </label>
                  <input
                    type="text"
                    name="cvc"
                    value={cardInfo.cvc}
                    onChange={handleCardInfoChange}
                    placeholder="123"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                      errors.cvc ? 'border-red-300' : 'border-gray-300'
                    }`}
                    maxLength="4"
                  />
                  {errors.cvc && (
                    <p className="mt-1 text-sm text-red-600">{errors.cvc}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カード名義（半角ローマ字）
                </label>
                <input
                  type="text"
                  name="name"
                  value={cardInfo.name}
                  onChange={handleCardInfoChange}
                  placeholder="TARO YAMADA"
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* 料金表示 */}
          <div className="mt-8 border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center text-lg font-medium">
              <span>お支払い金額</span>
              <span>¥{totalAmount.toLocaleString()}</span>
            </div>
          </div>

          {/* 支払いボタン */}
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              戻る
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className={`
                px-6 py-2 rounded-md text-white font-medium
                ${isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700'}
              `}
            >
              {isProcessing ? '処理中...' : '予約を確定する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage; 