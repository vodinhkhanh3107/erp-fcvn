"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parse_duration_1 = require("./parse-duration");
describe('parseDurationToSeconds()', () => {
    it('chuyển đổi đúng các đơn vị s/m/h/d', () => {
        expect((0, parse_duration_1.parseDurationToSeconds)('45s')).toBe(45);
        expect((0, parse_duration_1.parseDurationToSeconds)('30m')).toBe(30 * 60);
        expect((0, parse_duration_1.parseDurationToSeconds)('8h')).toBe(8 * 60 * 60);
        expect((0, parse_duration_1.parseDurationToSeconds)('7d')).toBe(7 * 60 * 60 * 24);
    });
    it('chuỗi sai định dạng → ném lỗi rõ ràng', () => {
        expect(() => (0, parse_duration_1.parseDurationToSeconds)('8')).toThrow();
        expect(() => (0, parse_duration_1.parseDurationToSeconds)('8hours')).toThrow();
        expect(() => (0, parse_duration_1.parseDurationToSeconds)('abc')).toThrow();
    });
});
//# sourceMappingURL=parse-duration.spec.js.map