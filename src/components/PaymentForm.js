import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const PaymentForm = () => {
  const [reservationData, setReservationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // セッションストレージから予約データを取得
    const data = sessionStorage.getItem('reservationData');
    if (data) {
      setReservationData(JSON.parse(data));
    } else {
      navigate('/reservations');
    }
  }, [navigate]);

  // カード番号のフォーマット
  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}|.+/g) || [];
    return groups.join(' ').substr(0, 19); // 16桁 + 3つのスペース
  };

  // 有効期限のフォーマット
  const formatExpiryDate = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      const month = numbers.substr(0, 2);
      const year = numbers.substr(2, 2);
      if (parseInt(month) > 12) {
        return '12/' + year;
      }
      return month + (year ? '/' + year : '');
    }
    return numbers;
  };

  // セキュリティコードのフォーマット
  const formatCVV = (value) => {
    return value.replace(/\D/g, '').substr(0, 4);
  };

  // カード名義のフォーマット
  const formatCardholderName = (value) => {
    return value.replace(/[^A-Za-z\s]/g, '').toUpperCase();
  };

  // 入力値の検証
  const validateForm = () => {
    const newErrors = {};
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    // カード番号の検証
    if (paymentInfo.cardNumber.replace(/\s/g, '').length !== 16) {
      newErrors.cardNumber = 'カード番号は16桁で入力してください';
    }

    // 有効期限の検証
    if (paymentInfo.expiryDate) {
      const [month, year] = paymentInfo.expiryDate.split('/').map(Number);
      if (!month || !year || month < 1 || month > 12) {
        newErrors.expiryDate = '有効な有効期限を入力してください';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        newErrors.expiryDate = '有効期限が過ぎています';
      }
    } else {
      newErrors.expiryDate = '有効期限を入力してください';
    }

    // セキュリティコードの検証
    if (paymentInfo.cvv.length < 3) {
      newErrors.cvv = 'セキュリティコードは3桁以上で入力してください';
    }

    // カード名義の検証
    if (paymentInfo.name.trim().length < 3) {
      newErrors.name = 'カード名義を入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'expiryDate':
        formattedValue = formatExpiryDate(value);
        break;
      case 'cvv':
        formattedValue = formatCVV(value);
        break;
      case 'name':
        formattedValue = formatCardholderName(value);
        break;
      default:
        break;
    }

    setPaymentInfo(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setLoading(true);

    try {
      // TODO: 実際の支払い処理の実装
      // 支払い処理が成功したら予約確認画面へ
      const confirmationData = {
        ...reservationData,
        paymentStatus: 'completed',
        confirmationNumber: Math.random().toString(36).substr(2, 9).toUpperCase()
      };
      sessionStorage.setItem('confirmationData', JSON.stringify(confirmationData));
      navigate('/confirmation');
    } catch (error) {
      console.error('Payment error:', error);
      alert('支払い処理中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  if (!reservationData) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h2 className="text-2xl font-bold mb-6">支払い情報入力</h2>

      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="text-lg font-semibold mb-2">予約内容</h3>
        <p>日時: {format(new Date(reservationData.date), 'yyyy年M月d日(E)', { locale: ja })} {reservationData.time}</p>
        <p>人数: {reservationData.numberOfPeople}人</p>
        <p className="mt-2 font-semibold">お支払い金額: ¥{reservationData.numberOfPeople * 5000}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            カード番号
          </label>
          <input
            type="text"
            name="cardNumber"
            value={paymentInfo.cardNumber}
            onChange={handleChange}
            placeholder="1234 5678 9012 3456"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.cardNumber ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.cardNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.cardNumber}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              有効期限
            </label>
            <input
              type="text"
              name="expiryDate"
              value={paymentInfo.expiryDate}
              onChange={handleChange}
              placeholder="MM/YY"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.expiryDate ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.expiryDate && (
              <p className="mt-1 text-sm text-red-600">{errors.expiryDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              セキュリティコード
            </label>
            <input
              type="text"
              name="cvv"
              value={paymentInfo.cvv}
              onChange={handleChange}
              placeholder="123"
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.cvv ? 'border-red-300' : 'border-gray-300'
              }`}
              required
            />
            {errors.cvv && (
              <p className="mt-1 text-sm text-red-600">{errors.cvv}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            カード名義人
          </label>
          <input
            type="text"
            name="name"
            value={paymentInfo.name}
            onChange={handleChange}
            placeholder="TARO YAMADA"
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? '処理中...' : '支払いを確定する'}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm; 