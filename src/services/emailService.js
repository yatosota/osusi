import { getFunctions, httpsCallable } from 'firebase/functions';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

const functions = getFunctions();

// 予約確認メールを送信
export const sendReservationConfirmation = async (reservation) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendReservationConfirmation');
    
    // メールに表示する予約情報を整形
    const emailData = {
      to: reservation.userEmail,
      reservation: {
        ...reservation,
        formattedDate: format(reservation.date, 'yyyy年MM月dd日(E)', { locale: ja }),
        formattedTime: reservation.time
      }
    };

    await sendEmail(emailData);
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    throw new Error('予約確認メールの送信に失敗しました');
  }
};

// 予約リマインダーメールを送信（24時間前）
export const sendReservationReminder = async (reservation) => {
  try {
    const sendEmail = httpsCallable(functions, 'sendReservationReminder');
    
    const emailData = {
      to: reservation.userEmail,
      reservation: {
        ...reservation,
        formattedDate: format(reservation.date, 'yyyy年MM月dd日(E)', { locale: ja }),
        formattedTime: reservation.time
      }
    };

    await sendEmail(emailData);
  } catch (error) {
    console.error('Failed to send reminder email:', error);
    throw new Error('リマインダーメールの送信に失敗しました');
  }
}; 