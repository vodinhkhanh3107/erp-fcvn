import { parseDurationToSeconds } from './parse-duration';

describe('parseDurationToSeconds()', () => {
  it('chuyển đổi đúng các đơn vị s/m/h/d', () => {
    expect(parseDurationToSeconds('45s')).toBe(45);
    expect(parseDurationToSeconds('30m')).toBe(30 * 60);
    expect(parseDurationToSeconds('8h')).toBe(8 * 60 * 60);
    expect(parseDurationToSeconds('7d')).toBe(7 * 60 * 60 * 24);
  });

  it('chuỗi sai định dạng → ném lỗi rõ ràng', () => {
    expect(() => parseDurationToSeconds('8')).toThrow();
    expect(() => parseDurationToSeconds('8hours')).toThrow();
    expect(() => parseDurationToSeconds('abc')).toThrow();
  });
});
