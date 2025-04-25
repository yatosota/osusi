import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

export const formatDateTime = (date) => {
  if (!date) return '';
  return format(date, 'yyyy年M月d日(E) HH:mm', { locale: ja });
};

export const getSeatTypeName = (seatType) => {
  const seatTypes = {
    counter: 'カウンター席',
    table: 'テーブル席',
    private: '個室'
  };
  return seatTypes[seatType] || seatType;
};

export const getCourseTypeName = (courseType) => {
  const courseTypes = {
    standard: 'スタンダードコース',
    premium: 'プレミアムコース',
    takumi: '匠（たくみ）コース',
    miyabi: '雅（みやび）コース'
  };
  return courseTypes[courseType] || courseType;
};

export const formatPrice = (price) => {
  return price.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' });
}; 