export function parseDurationToSeconds(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration.trim());
  if (!match) {
    throw new Error(
      `Định dạng thời hạn không hợp lệ: "${duration}" — chỉ hỗ trợ vd. "30s", "15m", "8h", "7d"`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const secondsPerUnit: Record<string, number> = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  };

  return value * secondsPerUnit[unit];
}
