import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import ja from 'date-fns/locale/ja';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { addDays, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { 
  createReservation,
  getReservationsByDate,
  getUserReservations
} from '../services/reservationService';
import { sendReservationConfirmation } from '../services/emailService';

const locales = {
  'ja': ja,
  'en': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const messages = {
  ja: {
    today: '今日',
    previous: '前へ',
    next: '次へ',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定一覧',
    date: '日付',
    time: '時間',
    event: 'イベント',
    noEventsInRange: 'この期間に予定はありません',
  },
  en: {
    today: 'Today',
    previous: 'Back',
    next: 'Next',
    month: 'Month',
    week: 'Week',
    day: 'Day',
    agenda: 'Agenda',
    date: 'Date',
    time: 'Time',
    event: 'Event',
    noEventsInRange: 'No events in this range',
  }
};

function ReservationForm() {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState('ja');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMonthCalendar, setShowMonthCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    people: '1',
    time: '',
    name: '',
    nameKana: '',
    email: '',
    phone: '',
    notes: '',
    hasAllergy: 'no',
    allergyDetails: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: '',
  });
  const [errors, setErrors] = useState({});
  const [reservations, setReservations] = useState([]);
  const [userReservations, setUserReservations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const timeSlots = ['17:30', '20:00', '20:30'];
  const peopleOptions = Array.from({ length: 6 }, (_, i) => i + 1);

  const texts = {
    ja: {
      name: '名前',
      email: 'メールアドレス',
      phone: '電話番号',
      people: '人数',
      time: '時間',
      date: '予約日',
      specialRequests: 'ご要望',
      allergies: 'アレルギー・苦手な食材',
      required: '必須',
      submit: '予約する',
      cancel: 'キャンセル',
      confirmTitle: '予約内容の確認',
      requiredError: 'この項目は必須です',
      selectDate: '日付を選択',
      selectTime: '時間を選択',
      reservationStatus: '予約状況',
      days: ['日', '月', '火', '水', '木', '金', '土'],
      months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
      available: '予約可能',
      unavailable: '予約不可',
      closed: '定休日',
      next: '次へ',
      back: '戻る',
      confirm: '予約を確定する',
      nameKana: 'お名前(フリガナ)',
      notes: '備考（必須）',
      personalInfo: '予約者情報',
      reservationDetails: '予約内容',
      previousWeek: '前の週',
      nextWeek: '次の週',
      emailError: '有効なメールアドレスを入力してください',
      phoneError: '有効な電話番号を入力してください',
      hasAllergy: 'アレルギーの有無',
      allergyYes: 'あり',
      allergyNo: 'なし',
      allergyDetails: 'アレルギーの詳細',
      previousMonth: '前月',
      nextMonth: '次月',
      pleaseEnterAllergy: 'アレルギーの詳細を入力してください',
      payment: '支払い情報',
      cardNumber: 'カード番号',
      cardExpiry: '有効期限 (MM/YY)',
      cardCvc: 'セキュリティコード',
      cardName: 'カード名義人',
      cardNumberError: '有効なカード番号を入力してください',
      cardExpiryError: '有効な有効期限を入力してください',
      cardCvcError: '有効なセキュリティコードを入力してください',
      cardNameError: 'カード名義人を入力してください',
      temporaryReservation: '仮予約中',
    },
    en: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      people: 'People',
      time: 'Time',
      date: 'Date',
      specialRequests: 'Special Requests',
      allergies: 'Allergies',
      required: 'Required',
      submit: 'Make Reservation',
      cancel: 'Cancel',
      confirmTitle: 'Confirm Reservation',
      requiredError: 'This field is required',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      reservationStatus: 'Reservation Status',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      available: 'Available',
      unavailable: 'Unavailable',
      closed: 'Closed',
      next: 'Next',
      back: 'Back',
      confirm: 'Confirm Reservation',
      nameKana: 'Name (Phonetic)',
      notes: 'Notes (Required)',
      personalInfo: 'Personal Information',
      reservationDetails: 'Reservation Details',
      previousWeek: 'Previous Week',
      nextWeek: 'Next Week',
      emailError: 'Please enter a valid email address',
      phoneError: 'Please enter a valid phone number',
      hasAllergy: 'Allergies',
      allergyYes: 'Yes',
      allergyNo: 'No',
      allergyDetails: 'Allergy Details',
      previousMonth: 'Previous Month',
      nextMonth: 'Next Month',
      pleaseEnterAllergy: 'Please enter allergy details',
      payment: 'Payment Information',
      cardNumber: 'Card Number',
      cardExpiry: 'Expiry Date (MM/YY)',
      cardCvc: 'CVC',
      cardName: 'Cardholder Name',
      cardNumberError: 'Please enter a valid card number',
      cardExpiryError: 'Please enter a valid expiry date',
      cardCvcError: 'Please enter a valid CVC',
      cardNameError: 'Please enter the cardholder name',
      temporaryReservation: 'Temporary Reservation',
    }
  };

  const t = texts[currentLang];

  const validateStep1 = () => {
    const newErrors = {};
    if (!selectedDate) newErrors.date = t.requiredError;
    if (!formData.time) newErrors.time = t.requiredError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = t.requiredError;
    if (!formData.nameKana) newErrors.nameKana = t.requiredError;
    if (!formData.email) newErrors.email = t.requiredError;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t.emailError;
    if (!formData.phone) newErrors.phone = t.requiredError;
    else if (!/^\d{10,11}$/.test(formData.phone.replace(/[-\s]/g, ''))) newErrors.phone = t.phoneError;
    if (!formData.notes) newErrors.notes = t.requiredError;
    if (formData.hasAllergy === 'yes' && !formData.allergyDetails) {
      newErrors.allergyDetails = t.pleaseEnterAllergy;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    
    if (!formData.cardNumber || !/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
      newErrors.cardNumber = t.cardNumberError;
    }
    
    if (!formData.cardExpiry || !/^(0[1-9]|1[0-2])\/([0-9]{2})$/.test(formData.cardExpiry)) {
      newErrors.cardExpiry = t.cardExpiryError;
    } else {
      const [month, year] = formData.cardExpiry.split('/');
      const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
      if (expiry < new Date()) {
        newErrors.cardExpiry = t.cardExpiryError;
      }
    }
    
    if (!formData.cardCvc || !/^\d{3,4}$/.test(formData.cardCvc)) {
      newErrors.cardCvc = t.cardCvcError;
    }
    
    if (!formData.cardName) {
      newErrors.cardName = t.cardNameError;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleConfirm = () => {
    console.log('Reservation confirmed:', formData);
  };

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));
  };

  const handlePreviousWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  };

  const getReservationStatus = (date, time) => {
    const key = `${format(date, 'yyyy-MM-dd')}-${time}`;
    
    if (selectedDate && 
        formData.time && 
        format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && 
        formData.time === time) {
      return 'temporary';
    }
    
    if (mockReservations[key] === undefined) return 'closed';
    return mockReservations[key] ? 'available' : 'unavailable';
  };

  const getDaysInYear = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year + 1, month, 0);
    const days = [];

    let currentDate = firstDay;
    while (currentDate <= lastDay) {
      days.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  const handleDateClick = () => {
    setShowMonthCalendar(true);
  };

  const handleDayClick = (date) => {
    if (date) {
      setSelectedDate(date);
      setShowMonthCalendar(false);
      setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    }
  };

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

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    switch (name) {
      case 'cardNumber':
        formattedValue = formatCardNumber(value);
        break;
      case 'cardExpiry':
        formattedValue = formatExpiry(value);
        break;
      case 'cardCvc':
        formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
        break;
      case 'cardName':
        formattedValue = value.toUpperCase();
        break;
      default:
        break;
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'time' && selectedDate) {
      setCurrentWeekStart(startOfWeek(selectedDate, { weekStartsOn: 1 }));
    }
  };

  const handleReservationCellClick = (date, time) => {
    const status = getReservationStatus(date, time);
    if (status === 'available') {
      setSelectedDate(date);
      setFormData(prev => ({
        ...prev,
        time: time
      }));
    }
  };

  const renderReservationCell = (date, time) => {
    const status = getReservationStatus(date, time);
    const isSelected = selectedDate && 
                      formData.time === time && 
                      isSameDay(date, selectedDate);

    return (
      <td
        key={`${date}-${time}`}
        onClick={() => handleReservationCellClick(date, time)}
        className={`
          p-2 border text-center 
          ${getStatusClassName(status)}
          ${status === 'available' ? 'cursor-pointer hover:bg-green-200' : ''}
          ${isSelected ? 'ring-2 ring-blue-500' : ''}
        `}
        title={status === 'available' ? t.clickToSelect : ''}
      >
        {renderReservationStatus(status)}
      </td>
    );
  };

  const mockReservations = {
    '2024-05-27-17:30': true,
    '2024-05-27-20:30': true,
    '2024-05-28-17:30': false,
    '2024-05-28-20:00': false,
    '2024-05-28-20:30': false,
    '2024-05-30-17:30': true,
    '2024-05-30-20:30': false,
    '2024-05-31-20:00': true,
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    const startDay = firstDay.getDay();
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const renderStep1 = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative">
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.date} <span className="text-red-500">*</span>
          </label>
          <button
            onClick={handleDateClick}
            className={`w-full p-2 text-left border rounded hover:border-blue-500 focus:outline-none focus:border-blue-500 ${
              errors.date ? 'border-red-500' : ''
            }`}
          >
            {selectedDate ? format(selectedDate, 'yyyy/MM/dd') : t.selectDate}
          </button>
          {errors.date && <p className="text-red-500 text-xs italic">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.time} <span className="text-red-500">*</span>
          </label>
          <select
            name="time"
            value={formData.time}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${errors.time ? 'border-red-500' : ''}`}
          >
            <option value="">{t.selectTime}</option>
            {timeSlots.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
          {errors.time && <p className="text-red-500 text-xs italic">{errors.time}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.people}
          </label>
          <select
            name="people"
            value={formData.people}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
          >
            {peopleOptions.map(num => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{t.reservationStatus}</h3>
          <div className="space-x-2">
            <button
              onClick={handlePreviousWeek}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              {t.previousWeek}
            </button>
            <button
              onClick={handleNextWeek}
              className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
            >
              {t.nextWeek}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border"></th>
                {getWeekDays().map((date) => (
                  <th key={date} className="p-2 border text-center">
                    <div>{t.days[date.getDay()]}</div>
                    <div>{format(date, 'M/d')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time) => (
                <tr key={time}>
                  <td className="p-2 border text-center">{time}</td>
                  {getWeekDays().map((date) => renderReservationCell(date, time))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  const renderStep2 = () => (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">{t.personalInfo}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.name} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-500 text-xs italic">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.nameKana} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nameKana"
            value={formData.nameKana}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${errors.nameKana ? 'border-red-500' : ''}`}
          />
          {errors.nameKana && <p className="text-red-500 text-xs italic">{errors.nameKana}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.email} <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && <p className="text-red-500 text-xs italic">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.phone} <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : ''}`}
          />
          {errors.phone && <p className="text-red-500 text-xs italic">{errors.phone}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.notes} <span className="text-red-500">*</span>
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className={`w-full p-2 border rounded h-24 ${errors.notes ? 'border-red-500' : ''}`}
          />
          {errors.notes && <p className="text-red-500 text-xs italic">{errors.notes}</p>}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.hasAllergy} <span className="text-red-500">*</span>
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="hasAllergy"
                value="yes"
                checked={formData.hasAllergy === 'yes'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">{t.allergyYes}</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="hasAllergy"
                value="no"
                checked={formData.hasAllergy === 'no'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">{t.allergyNo}</span>
            </label>
          </div>
        </div>

        {formData.hasAllergy === 'yes' && (
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t.allergyDetails} <span className="text-red-500">*</span>
            </label>
            <textarea
              name="allergyDetails"
              value={formData.allergyDetails}
              onChange={handleInputChange}
              className={`w-full p-2 border rounded h-24 ${errors.allergyDetails ? 'border-red-500' : ''}`}
            />
            {errors.allergyDetails && <p className="text-red-500 text-xs italic">{errors.allergyDetails}</p>}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">{t.payment}</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.cardNumber} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="cardNumber"
            value={formData.cardNumber}
            onChange={handleInputChange}
            placeholder="1234 5678 9012 3456"
            maxLength="19"
            className={`w-full p-2 border rounded ${errors.cardNumber ? 'border-red-500' : ''}`}
            onKeyPress={(e) => {
              if (!/[0-9\s]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
          {errors.cardNumber && <p className="text-red-500 text-xs italic">{errors.cardNumber}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t.cardExpiry} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardExpiry"
              value={formData.cardExpiry}
              onChange={handleInputChange}
              placeholder="MM/YY"
              maxLength="5"
              className={`w-full p-2 border rounded ${errors.cardExpiry ? 'border-red-500' : ''}`}
              onKeyPress={(e) => {
                if (!/[0-9/]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.cardExpiry && <p className="text-red-500 text-xs italic">{errors.cardExpiry}</p>}
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">
              {t.cardCvc} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cardCvc"
              value={formData.cardCvc}
              onChange={handleInputChange}
              placeholder="123"
              maxLength="4"
              className={`w-full p-2 border rounded ${errors.cardCvc ? 'border-red-500' : ''}`}
              onKeyPress={(e) => {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }}
            />
            {errors.cardCvc && <p className="text-red-500 text-xs italic">{errors.cardCvc}</p>}
          </div>
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">
            {t.cardName} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="cardName"
            value={formData.cardName}
            onChange={handleInputChange}
            placeholder="TARO YAMADA"
            className={`w-full p-2 border rounded ${errors.cardName ? 'border-red-500' : ''}`}
            onKeyPress={(e) => {
              if (!/[A-Za-z\s]/.test(e.key)) {
                e.preventDefault();
              }
            }}
          />
          {errors.cardName && <p className="text-red-500 text-xs italic">{errors.cardName}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="max-w-2xl mx-auto">
      <h3 className="text-lg font-bold mb-4">{t.confirmTitle}</h3>
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <h4 className="font-bold mb-2">{t.reservationDetails}</h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="font-medium">{t.date}:</dt>
            <dd>{format(selectedDate, 'yyyy/MM/dd')}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.time}:</dt>
            <dd>{formData.time}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.people}:</dt>
            <dd>{formData.people}名</dd>
          </div>
        </dl>

        <h4 className="font-bold mt-4 mb-2">{t.personalInfo}</h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="font-medium">{t.name}:</dt>
            <dd>{formData.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.nameKana}:</dt>
            <dd>{formData.nameKana}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.email}:</dt>
            <dd>{formData.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.phone}:</dt>
            <dd>{formData.phone}</dd>
          </div>
          {formData.notes && (
            <div className="flex justify-between">
              <dt className="font-medium">{t.notes}:</dt>
              <dd>{formData.notes}</dd>
            </div>
          )}
          {formData.hasAllergy === 'yes' && (
            <div className="flex justify-between">
              <dt className="font-medium">{t.allergyDetails}:</dt>
              <dd>{formData.allergyDetails}</dd>
            </div>
          )}
        </dl>

        <h4 className="font-bold mt-4 mb-2">{t.payment}</h4>
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="font-medium">{t.cardNumber}:</dt>
            <dd>**** **** **** {formData.cardNumber.slice(-4)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.cardExpiry}:</dt>
            <dd>{formData.cardExpiry}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">{t.cardName}:</dt>
            <dd>{formData.cardName}</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const renderReservationStatus = (status) => {
    switch (status) {
      case 'available':
        return '○';
      case 'temporary':
        return '◎';
      case 'unavailable':
        return '×';
      default:
        return '-';
    }
  };

  // 予約状況表示のセルの背景色を定義
  const getStatusClassName = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100';
      case 'temporary':
        return 'bg-yellow-100';
      case 'unavailable':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  // 選択された日付の予約情報を取得
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const data = await getReservationsByDate(selectedDate);
        setReservations(data);
      } catch (error) {
        setError('予約情報の取得に失敗しました');
      }
    };

    fetchReservations();
  }, [selectedDate]);

  // ユーザーの予約履歴を取得
  useEffect(() => {
    const fetchUserReservations = async () => {
      try {
        const data = await getUserReservations(user.uid);
        setUserReservations(data);
      } catch (error) {
        setError('予約履歴の取得に失敗しました');
      }
    };

    fetchUserReservations();
  }, [user]);

  // 予約送信処理
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // バリデーション
      if (!selectedDate || !formData.time || !formData.people) {
        throw new Error('すべての項目を入力してください');
      }

      // 予約データを作成
      const reservationData = {
        date: selectedDate,
        time: formData.time,
        numberOfPeople: parseInt(formData.people),
        userId: user.uid,
        userEmail: user.email,
        name: formData.name,
        nameKana: formData.nameKana,
        phone: formData.phone,
        notes: formData.notes,
        hasAllergy: formData.hasAllergy,
        allergyDetails: formData.hasAllergy === 'yes' ? formData.allergyDetails : null
      };

      // 予約を作成
      const newReservation = await createReservation(reservationData);

      // 予約確認メールを送信
      await sendReservationConfirmation(newReservation);
      
      setSuccess('予約が完了しました。確認メールをお送りしましたのでご確認ください。');
      
      // フォームをリセット
      setFormData({
        people: '1',
        time: '',
        name: '',
        nameKana: '',
        email: '',
        phone: '',
        notes: '',
        hasAllergy: 'no',
        allergyDetails: '',
        cardNumber: '',
        cardExpiry: '',
        cardCvc: '',
        cardName: '',
      });
      
      // 予約情報を再取得
      const updatedReservations = await getReservationsByDate(selectedDate);
      setReservations(updatedReservations);
      
      // ユーザーの予約履歴を再取得
      const updatedUserReservations = await getUserReservations(user.uid);
      setUserReservations(updatedUserReservations);

      // 予約完了後、ステップ1に戻る
      setStep(1);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <select
          value={currentLang}
          onChange={(e) => setCurrentLang(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="ja">日本語</option>
          <option value="en">English</option>
        </select>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}

      <div className="flex justify-between mt-6">
        {step > 1 && (
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {t.back}
          </button>
        )}
        <div className="ml-auto">
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t.next}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              {t.submit}
            </button>
          )}
        </div>
      </div>

      {showMonthCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={handlePreviousMonth}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {t.previousMonth}
                </button>
                <div className="text-xl font-bold">
                  {t.months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  {t.nextMonth}
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {t.days.map((day) => (
                  <div key={day} className="text-center font-bold">
                    {day}
                  </div>
                ))}
                {getDaysInMonth().map((date, index) => (
                  <div
                    key={index}
                    onClick={() => date && handleDayClick(date)}
                    className={`
                      p-2 text-center cursor-pointer hover:bg-gray-100 rounded
                      ${!date ? 'text-gray-400' : ''}
                      ${date && isSameDay(date, selectedDate) ? 'bg-blue-500 text-white' : ''}
                    `}
                  >
                    {date ? date.getDate() : ''}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowMonthCalendar(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 成功メッセージ */}
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded mb-4">
          {success}
        </div>
      )}

      {/* 予約履歴 */}
      {userReservations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">予約履歴</h2>
          <div className="space-y-4">
            {userReservations.map((reservation) => (
              <div
                key={reservation.id}
                className="border rounded p-4"
              >
                <p>日時: {format(reservation.date, 'yyyy/MM/dd HH:mm', { locale: ja })}</p>
                <p>人数: {reservation.numberOfPeople}人</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReservationForm; 