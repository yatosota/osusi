import {
  validateReservationDateTime,
  validatePartySize,
  validateCourseTime
} from '../reservationValidation';

describe('reservationValidation', () => {
  describe('validateReservationDateTime', () => {
    it('有効な予約日時の場合、trueを返すこと', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(13, 0, 0); // 13:00に設定

      const result = validateReservationDateTime(tomorrow);
      expect(result.isValid).toBe(true);
    });

    it('過去の日時の場合、falseを返すこと', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = validateReservationDateTime(yesterday);
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/過去の日時は指定できません/);
    });

    it('3ヶ月以上先の日時の場合、falseを返すこと', () => {
      const fourMonthsLater = new Date();
      fourMonthsLater.setMonth(fourMonthsLater.getMonth() + 4);

      const result = validateReservationDateTime(fourMonthsLater);
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/3ヶ月先までの日時のみ予約可能です/);
    });

    it('営業時間外の場合、falseを返すこと', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 0, 0); // 23:00に設定

      const result = validateReservationDateTime(tomorrow);
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/営業時間/);
    });
  });

  describe('validatePartySize', () => {
    it('有効な予約人数の場合、trueを返すこと', () => {
      const result = validatePartySize(4);
      expect(result.isValid).toBe(true);
    });

    it('最小人数未満の場合、falseを返すこと', () => {
      const result = validatePartySize(0);
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/1名以上で予約してください/);
    });

    it('最大人数を超える場合、falseを返すこと', () => {
      const result = validatePartySize(9);
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/8名以下で予約してください/);
    });

    it('コースの最小人数制限を下回る場合、falseを返すこと', () => {
      const result = validatePartySize(1, 'lunch');
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/2名以上で予約してください/);
    });
  });

  describe('validateCourseTime', () => {
    it('ランチコースの有効な時間帯の場合、trueを返すこと', () => {
      const lunchTime = new Date();
      lunchTime.setHours(12, 0, 0);

      const result = validateCourseTime(lunchTime, 'lunch');
      expect(result.isValid).toBe(true);
    });

    it('ディナーコースの有効な時間帯の場合、trueを返すこと', () => {
      const dinnerTime = new Date();
      dinnerTime.setHours(18, 0, 0);

      const result = validateCourseTime(dinnerTime, 'dinner');
      expect(result.isValid).toBe(true);
    });

    it('ランチコースの無効な時間帯の場合、falseを返すこと', () => {
      const eveningTime = new Date();
      eveningTime.setHours(17, 0, 0);

      const result = validateCourseTime(eveningTime, 'lunch');
      expect(result.isValid).toBe(false);
      expect(result.message).toMatch(/11:00～15:00の間でのみ予約可能です/);
    });

    it('コースタイプが指定されていない場合、trueを返すこと', () => {
      const result = validateCourseTime(new Date(), null);
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('通常メニューの予約です');
    });
  });
}); 