/**
 * 日付をフォーマットするユーティリティ関数
 */
export const formatDate = (date) => {
  if (!date) return '日時が未設定です';
  
  const d = new Date(date);
  if (!(d instanceof Date) || isNaN(d)) {
    return '日時の表示に問題が発生しました';
  }

  try {
    const options = {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return d.toLocaleString('ja-JP', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return '日時の表示に問題が発生しました';
  }
};

/**
 * 日付が有効かどうかをチェックする関数
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
}; 