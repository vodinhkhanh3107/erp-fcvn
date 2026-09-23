import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const RUNS = Number(process.env.RUNS) || 10;
const SLA_THRESHOLD_MS = 3000; // Yêu cầu NFR: <3 giây

if (!ACCESS_TOKEN) {
  console.error(
    'Thiếu ACCESS_TOKEN. Chạy: ACCESS_TOKEN=<token> node measure-supplier-create-performance.js',
  );
  process.exit(1);
}

function buildRandomSupplierPayload(index) {
  const uniqueSuffix = `${Date.now()}-${index}`;
  return {
    name: `Công ty Test Performance ${uniqueSuffix}`,
    taxCode: `PERF-${uniqueSuffix}`,
    contactEmail: `perf-test-${uniqueSuffix}@example.com`,
  };
}

async function measureOnce(index) {
  const payload = buildRandomSupplierPayload(index);
  const startedAt = Date.now();

  try {
    await axios.post(`${API_BASE_URL}/suppliers`, payload, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      timeout: 15000, // timeout riêng của script (không phải NFR) — tránh script treo vô hạn
    });
    return { elapsedMs: Date.now() - startedAt, success: true };
  } catch (err) {
    return {
      elapsedMs: Date.now() - startedAt,
      success: false,
      error: axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : err instanceof Error
          ? err.message
          : 'Da xay ra loi khong xac dinh',
    };
  }
}

function percentile(sortedArr, p) {
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

async function main() {
  console.log(`\n=== Đo performance API tạo nhà cung cấp (POST /suppliers) ===`);
  console.log(`Base URL: ${API_BASE_URL}`);
  console.log(`Số lần chạy: ${RUNS}`);
  console.log(`Ngưỡng SLA (NFR): ${SLA_THRESHOLD_MS}ms\n`);

  const results = [];
  for (let i = 0; i < RUNS; i++) {
    const result = await measureOnce(i);
    results.push(result);
    const statusIcon = result.success ? 'success' : 'fail';
    console.log(
      `  Lần ${i + 1}/${RUNS}: ${result.elapsedMs}ms ${statusIcon}${result.error ? ` (${result.error})` : ''}`,
    );
  }

  const successResults = results.filter((r) => r.success);
  const failedCount = results.length - successResults.length;

  if (successResults.length === 0) {
    console.error(
      '\n Không có lần gọi nào thành công — không thể tính thống kê. Kiểm tra lại token/URL.',
    );
    process.exit(1);
  }

  const times = successResults.map((r) => r.elapsedMs).sort((a, b) => a - b);
  const min = times[0];
  const max = times[times.length - 1];
  const avg = Math.round(times.reduce((sum, t) => sum + t, 0) / times.length);
  const p95 = percentile(times, 95);
  const overThreshold = times.filter((t) => t > SLA_THRESHOLD_MS).length;
  const passed = overThreshold === 0 && failedCount === 0;

  console.log(`\n=== KẾT QUẢ TỔNG HỢP ===`);
  console.log(`Thành công: ${successResults.length}/${RUNS} (${failedCount} lỗi)`);
  console.log(`Min: ${min}ms | Max: ${max}ms | Avg: ${avg}ms | P95: ${p95}ms`);
  console.log(`Số lần vượt ngưỡng ${SLA_THRESHOLD_MS}ms: ${overThreshold}/${times.length}`);
  console.log(
    `\nKẾT LUẬN NFR: ${passed ? 'PASS — đáp ứng yêu cầu <3 giây' : 'FAIL — có lần vượt quá 3 giây hoặc có lỗi'}`,
  );

  console.log(`\n=== BẢNG COPY VÀO TEST REPORT (Markdown) ===\n`);
  console.log(`| Chỉ số | Giá trị |`);
  console.log(`|---|---|`);
  console.log(`| Số lần đo | ${RUNS} |`);
  console.log(`| Thành công | ${successResults.length}/${RUNS} |`);
  console.log(`| Min | ${min}ms |`);
  console.log(`| Max | ${max}ms |`);
  console.log(`| Trung bình (Avg) | ${avg}ms |`);
  console.log(`| P95 | ${p95}ms |`);
  console.log(`| Ngưỡng NFR | ${SLA_THRESHOLD_MS}ms |`);
  console.log(`| Kết luận | ${passed ? 'PASS' : 'FAIL'} |`);
  console.log(`| Thời điểm đo | ${new Date().toLocaleString('vi-VN')} |`);

  process.exit(passed ? 0 : 1);
}

main();
