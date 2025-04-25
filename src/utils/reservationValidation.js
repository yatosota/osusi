import { isValidDate } from './dateUtils';

/**
 * 営業時間の定義
 */
const BUSINESS_HOURS = {
  start: 11, // 11:00
  end: 22,   // 22:00
  lastOrder: 21 // 21:00
};

/**
 * 予約可能な最大人数
 */
const MAX_PARTY_SIZE = 8;

/**
 * 予約可能な最小人数
 */
const MIN_PARTY_SIZE = 1;

/**
 * 座席タイプの定義
 */
export const SEAT_TYPES = {
  counter: {
    name: 'カウンター席',
    price: 0, // 追加料金なし
    maxPartySize: 6
  },
  table: {
    name: 'テーブル席',
    price: 500, // 1人あたり500円追加
    maxPartySize: 8
  },
  private: {
    name: '個室',
    price: 1000, // 1人あたり1000円追加
    maxPartySize: 8,
    minPartySize: 2
  }
};

/**
 * コース料理の定義
 */
export const COURSE_TYPES = {
  takumi: {
    name: '匠（たくみ）コース',
    description: '高級ネタ中心の特選コース',
    price: 8000,
    minPartySize: 2
  },
  miyabi: {
    name: '雅（みやび）コース',
    description: 'バランスの取れた定番コース',
    price: 5000,
    minPartySize: 1
  }
};

/**
 * 予約日時が有効かどうかをチェックする
 * @param {Date|string} date - チェックする日時
 * @returns {{isValid: boolean, message: string}} 検証結果とメッセージ
 */
export const validateReservationDateTime = (date) => {
  if (!isValidDate(date)) {
    return {
      isValid: false,
      message: '無効な日時です'
    };
  }

  const reservationDate = new Date(date);
  const now = new Date();

  // 過去の日時でないことをチェック
  if (reservationDate < now) {
    return {
      isValid: false,
      message: '過去の日時は指定できません'
    };
  }

  // 3ヶ月先までの予約に制限
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  if (reservationDate > threeMonthsLater) {
    return {
      isValid: false,
      message: '3ヶ月先までの日時のみ予約可能です'
    };
  }

  // 営業時間内かチェック
  const hours = reservationDate.getHours();
  if (hours < BUSINESS_HOURS.start || hours >= BUSINESS_HOURS.end) {
    return {
      isValid: false,
      message: `営業時間（${BUSINESS_HOURS.start}:00～${BUSINESS_HOURS.end}:00）内で指定してください`
    };
  }

  // ラストオーダー時間をチェック
  if (hours >= BUSINESS_HOURS.lastOrder) {
    return {
      isValid: false,
      message: `ラストオーダー（${BUSINESS_HOURS.lastOrder}:00）までに予約してください`
    };
  }

  return {
    isValid: true,
    message: '有効な予約日時です'
  };
};

/**
 * 予約人数が有効かどうかをチェックする
 * @param {number} partySize - 予約人数
 * @param {string} courseType - コースの種類（任意）
 * @param {string} seatType - 座席タイプ（任意）
 * @returns {{isValid: boolean, message: string}} 検証結果とメッセージ
 */
export const validatePartySize = (partySize, courseType = null, seatType = null) => {
  // 基本的な人数制限をチェック
  if (partySize < MIN_PARTY_SIZE) {
    return {
      isValid: false,
      message: `${MIN_PARTY_SIZE}名以上で予約してください`
    };
  }

  if (partySize > MAX_PARTY_SIZE) {
    return {
      isValid: false,
      message: `${MAX_PARTY_SIZE}名以下で予約してください`
    };
  }

  // コース料理の場合の追加チェック
  if (courseType) {
    const course = COURSE_TYPES[courseType];
    if (course && partySize < course.minPartySize) {
      return {
        isValid: false,
        message: `${course.name}は${course.minPartySize}名以上で予約してください`
      };
    }
  }

  // 座席タイプの追加チェック
  if (seatType) {
    const seat = SEAT_TYPES[seatType];
    if (seat) {
      if (seat.maxPartySize && partySize > seat.maxPartySize) {
        return {
          isValid: false,
          message: `${seat.name}は${seat.maxPartySize}名以下で予約してください`
        };
      }
      if (seat.minPartySize && partySize < seat.minPartySize) {
        return {
          isValid: false,
          message: `${seat.name}は${seat.minPartySize}名以上で予約してください`
        };
      }
    }
  }

  return {
    isValid: true,
    message: '有効な予約人数です'
  };
};

/**
 * 予約の合計金額を計算する
 * @param {string} courseType - コースの種類
 * @param {string} seatType - 座席タイプ
 * @param {number} partySize - 予約人数
 * @returns {{basePrice: number, seatPrice: number, total: number}} 料金の内訳と合計
 */
export const calculateTotalPrice = (courseType, seatType, partySize) => {
  const course = COURSE_TYPES[courseType];
  const seat = SEAT_TYPES[seatType];
  
  const basePrice = course ? course.price * partySize : 0;
  const seatPrice = seat ? seat.price * partySize : 0;
  
  return {
    basePrice,
    seatPrice,
    total: basePrice + seatPrice
  };
}; 