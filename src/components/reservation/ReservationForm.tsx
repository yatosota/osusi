import { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/router';
import { useAuth } from '@/hooks/useAuth';

interface ReservationFormProps {
  isGuest?: boolean;
}

const ReservationForm = ({ isGuest = false }: ReservationFormProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reservationData = {
        date,
        time,
        numberOfPeople,
        name: isGuest ? name : user?.displayName || '',
        phone: isGuest ? phone : user?.phoneNumber || '',
        userId: isGuest ? null : user?.uid,
        status: 'pending',
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'reservations'), reservationData);
      router.push('/reservation/confirmation');
    } catch (err) {
      setError('予約の登録に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">ご予約</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="date">
            予約日
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="time">
            予約時間
          </label>
          <select
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">時間を選択してください</option>
            {Array.from({ length: 8 }, (_, i) => i + 11).map((hour) => (
              <option key={hour} value={`${hour}:00`}>
                {hour}:00
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="numberOfPeople">
            人数
          </label>
          <select
            id="numberOfPeople"
            value={numberOfPeople}
            onChange={(e) => setNumberOfPeople(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}名
              </option>
            ))}
          </select>
        </div>
        {isGuest && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2" htmlFor="name">
                お名前
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2" htmlFor="phone">
                電話番号
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                pattern="[0-9]{10,11}"
                placeholder="09012345678"
              />
            </div>
          </>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? '予約処理中...' : '予約する'}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm; 