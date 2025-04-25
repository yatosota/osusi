import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';

interface Reservation {
  id: string;
  date: string;
  time: string;
  numberOfPeople: number;
  status: string;
  createdAt: Date;
}

const ReservationHistory = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        const reservationsRef = collection(db, 'reservations');
        const q = query(
          reservationsRef,
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const reservationList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Reservation[];

        setReservations(reservationList);
      } catch (error) {
        console.error('Error fetching reservations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReservations();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        予約履歴がありません
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">予約履歴</h2>
      {reservations.map((reservation) => (
        <div
          key={reservation.id}
          className="bg-white p-4 rounded-lg shadow border border-gray-200"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-lg font-semibold">
                {reservation.date} {reservation.time}
              </p>
              <p className="text-gray-600">{reservation.numberOfPeople}名様</p>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  reservation.status === 'confirmed'
                    ? 'bg-green-100 text-green-800'
                    : reservation.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {reservation.status === 'confirmed'
                  ? '予約確定'
                  : reservation.status === 'pending'
                  ? '予約待ち'
                  : 'キャンセル済み'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            予約日時: {reservation.createdAt.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReservationHistory; 