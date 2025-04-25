import { formatDate, isValidDate } from '../dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('正しい日付をフォーマットできること', () => {
      const date = new Date('2024-03-15T14:30:00');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/2024年/);
      expect(formatted).toMatch(/3月/);
      expect(formatted).toMatch(/15日/);
      expect(formatted).toMatch(/14:30/);
    });

    it('無効な日付の場合エラーメッセージを返すこと', () => {
      expect(formatDate(null)).toBe('日時が未設定です');
      expect(formatDate(undefined)).toBe('日時が未設定です');
      expect(formatDate('invalid')).toMatch(/日時の表示に問題が発生しました/);
    });
  });

  describe('isValidDate', () => {
    it('有効な日付の場合trueを返すこと', () => {
      expect(isValidDate(new Date())).toBe(true);
      expect(isValidDate('2024-03-15T14:30:00')).toBe(true);
    });

    it('無効な日付の場合falseを返すこと', () => {
      expect(isValidDate(null)).toBe(false);
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
    });
  });
}); 