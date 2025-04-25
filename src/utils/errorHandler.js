export const handleFirebaseError = (error) => {
  console.error('Firebase error:', error);
  
  const errorMessages = {
    'auth/user-not-found': 'ユーザーが見つかりません。',
    'auth/wrong-password': 'パスワードが正しくありません。',
    'auth/email-already-in-use': 'このメールアドレスは既に使用されています。',
    'auth/invalid-email': '無効なメールアドレスです。',
    'auth/weak-password': 'パスワードが弱すぎます。',
    'auth/network-request-failed': 'ネットワークエラーが発生しました。',
    'permission-denied': '権限がありません。',
    'not-found': '指定されたデータが見つかりません。',
  };

  return errorMessages[error.code] || '予期せぬエラーが発生しました。';
};

export const handleReservationError = (error) => {
  console.error('Reservation error:', error);
  
  const errorMessages = {
    'invalid-date': '無効な日付です。',
    'time-not-available': '指定された時間は予約できません。',
    'seat-not-available': '指定された席は予約できません。',
    'reservation-limit-exceeded': '予約可能な人数を超えています。',
    'already-reserved': '既に予約が存在します。',
  };

  return errorMessages[error.code] || '予約処理中にエラーが発生しました。';
}; 