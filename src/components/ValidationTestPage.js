import React, { useState } from 'react';
import {
  validateReservationDateTime,
  validatePartySize,
  calculateTotalPrice,
  COURSE_TYPES,
  SEAT_TYPES
} from '../utils/reservationValidation';

const ValidationTestPage = () => {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    partySize: '',
    courseType: '',
    seatType: ''
  });

  const [validationResults, setValidationResults] = useState({
    datetime: { isValid: true, message: '' },
    partySize: { isValid: true, message: '' }
  });

  const [priceDetails, setPriceDetails] = useState({
    basePrice: 0,
    seatPrice: 0,
    total: 0
  });

  // 予約可能な時間枠を生成
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 11; hour < 21; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 入力値が変更されたら検証を実行
    const newData = {
      ...formData,
      [name]: value
    };
    validateInputs(newData);

    // 料金を再計算
    if (['courseType', 'seatType', 'partySize'].includes(name)) {
      const { courseType, seatType, partySize } = {
        ...formData,
        [name]: value
      };
      if (courseType && partySize) {
        const prices = calculateTotalPrice(courseType, seatType, Number(partySize));
        setPriceDetails(prices);
      }
    }
  };

  const validateInputs = (data) => {
    const { date, time, partySize, courseType, seatType } = data;

    // 日時の検証
    if (date && time) {
      const dateTimeString = `${date}T${time}:00`;
      const dateTimeResult = validateReservationDateTime(dateTimeString);
      setValidationResults(prev => ({
        ...prev,
        datetime: dateTimeResult
      }));
    }

    // 人数の検証
    if (partySize) {
      const partySizeResult = validatePartySize(Number(partySize), courseType, seatType);
      setValidationResults(prev => ({
        ...prev,
        partySize: partySizeResult
      }));
    }
  };

  // 料金表示のフォーマット
  const formatPrice = (price) => {
    return `¥${price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-blue-500 text-white px-6 py-4">
          <h2 className="text-2xl font-bold">予約バリデーションテスト</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約日
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              予約時間
            </label>
            <select
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">時間を選択してください</option>
              {generateTimeSlots().map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              人数
            </label>
            <input
              type="number"
              name="partySize"
              value={formData.partySize}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              コースタイプ
            </label>
            <select
              name="courseType"
              value={formData.courseType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">コースを選択してください</option>
              {Object.entries(COURSE_TYPES).map(([key, course]) => (
                <option key={key} value={key}>
                  {course.name} ({formatPrice(course.price)}/人) - {course.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              座席タイプ
            </label>
            <select
              name="seatType"
              value={formData.seatType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">座席タイプを選択してください</option>
              {Object.entries(SEAT_TYPES).map(([key, seat]) => (
                <option key={key} value={key}>
                  {seat.name} {seat.price > 0 ? `(+${formatPrice(seat.price)}/人)` : '(追加料金なし)'}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 space-y-4">
            <div className={`p-4 rounded-md ${
              validationResults.datetime.isValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className="font-medium mb-2">日時の検証結果</h3>
              <p className={
                validationResults.datetime.isValid ? 'text-green-700' : 'text-red-700'
              }>
                {validationResults.datetime.message || '未入力'}
              </p>
            </div>

            <div className={`p-4 rounded-md ${
              validationResults.partySize.isValid ? 'bg-green-50' : 'bg-red-50'
            }`}>
              <h3 className="font-medium mb-2">人数の検証結果</h3>
              <p className={
                validationResults.partySize.isValid ? 'text-green-700' : 'text-red-700'
              }>
                {validationResults.partySize.message || '未入力'}
              </p>
            </div>

            {(formData.courseType || formData.seatType) && formData.partySize && (
              <div className="p-4 rounded-md bg-blue-50">
                <h3 className="font-medium mb-2">料金内訳</h3>
                {formData.courseType && (
                  <p className="text-blue-700">
                    コース料金: {formatPrice(priceDetails.basePrice)}
                  </p>
                )}
                {formData.seatType && priceDetails.seatPrice > 0 && (
                  <p className="text-blue-700">
                    座席料金: {formatPrice(priceDetails.seatPrice)}
                  </p>
                )}
                <p className="text-blue-700 font-bold mt-2">
                  合計金額: {formatPrice(priceDetails.total)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationTestPage; 