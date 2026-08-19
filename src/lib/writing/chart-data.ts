import type { ChartData, SimpleChartData } from './types';

/**
 * Kiểm định `chart_data` trước khi nó vào kho đề.
 *
 * Đề hỏng mà lọt vào seed thì lỗi chỉ lộ ra lúc vẽ, trên máy người học, và
 * không sửa được ngoài việc chạy lại toàn bộ ingest. Rẻ hơn nhiều là chặn ngay
 * tại chỗ sinh — nên hàm này trả lý do bằng tiếng Việt để log ingest đọc được
 * luôn, không phải mở code ra dò.
 */

export type ValidationResult = { ok: true; data: ChartData } | { ok: false; reason: string };

const fail = (reason: string): ValidationResult => ({ ok: false, reason });

export function validateChartData(data: unknown): ValidationResult {
  if (!isRecord(data)) return fail('chart_data không phải object.');

  const keyError = checkAnalysisKey(data.analysisKey);
  if (keyError) return fail(keyError);

  if (typeof data.title !== 'string' || data.title.trim() === '') {
    return fail('Thiếu title.');
  }

  if (data.kind === 'mixed') {
    if (!Array.isArray(data.parts) || data.parts.length !== 2) {
      return fail('Đề kết hợp phải có đúng hai hình.');
    }
    for (const part of data.parts) {
      if (isRecord(part) && part.kind === 'mixed') {
        return fail('Đề kết hợp không được lồng tiếp mixed.');
      }
      const inner = validateChartData(part);
      if (!inner.ok) return fail(`Hình con không hợp lệ: ${inner.reason}`);
    }
    return { ok: true, data: data as unknown as ChartData };
  }

  const problem = checkSimple(data);
  if (problem) return fail(problem);
  return { ok: true, data: data as unknown as SimpleChartData };
}

function checkSimple(data: Record<string, unknown>): string | null {
  switch (data.kind) {
    case 'line':
    case 'bar': {
      const labels = data.xLabels;
      const series = data.series;
      if (!Array.isArray(labels) || labels.length < 2) {
        return 'Cần ít nhất hai mốc trên trục X.';
      }
      if (!Array.isArray(series) || series.length === 0) {
        return 'Cần ít nhất một chuỗi dữ liệu.';
      }
      for (const s of series) {
        if (!isRecord(s) || typeof s.name !== 'string') return 'Chuỗi dữ liệu thiếu tên.';
        if (!Array.isArray(s.values) || s.values.length !== labels.length) {
          return `Chuỗi "${String(s.name)}" có số điểm dữ liệu không khớp số nhãn trục X.`;
        }
        if (s.values.some((v) => typeof v !== 'number' || !Number.isFinite(v))) {
          return `Chuỗi "${String(s.name)}" có giá trị không phải số.`;
        }
      }
      return null;
    }

    case 'pie': {
      const pies = data.pies;
      if (!Array.isArray(pies) || pies.length === 0) return 'Cần ít nhất một hình tròn.';
      for (const pie of pies) {
        if (!isRecord(pie) || !Array.isArray(pie.slices) || pie.slices.length < 2) {
          return 'Mỗi hình tròn cần ít nhất hai lát.';
        }
        let total = 0;
        for (const slice of pie.slices) {
          if (!isRecord(slice) || typeof slice.value !== 'number') return 'Lát thiếu giá trị số.';
          total += slice.value;
        }
        // Cho lệch 1 điểm vì đề thật hay làm tròn từng lát.
        if (Math.abs(total - 100) > 1) {
          return `Hình tròn "${String(pie.caption)}" có tổng ${total}, phải xấp xỉ 100.`;
        }
      }
      return null;
    }

    case 'table': {
      const headers = data.headers;
      const rows = data.rows;
      if (!Array.isArray(headers) || headers.length < 2) return 'Bảng cần ít nhất hai cột.';
      if (!Array.isArray(rows) || rows.length < 2) return 'Bảng cần ít nhất hai hàng.';
      for (const row of rows) {
        if (!Array.isArray(row) || row.length !== headers.length) {
          return 'Có hàng không đủ số cột như tiêu đề.';
        }
      }
      return null;
    }

    case 'process': {
      const steps = data.steps;
      if (!Array.isArray(steps) || steps.length < 3) return 'Quy trình cần ít nhất ba bước.';
      if (steps.some((s) => typeof s !== 'string' || s.trim() === '')) return 'Có bước để trống.';
      if (typeof data.isCycle !== 'boolean') return 'Thiếu isCycle.';
      return null;
    }

    case 'map': {
      const panels = data.panels;
      if (!Array.isArray(panels) || panels.length < 2) return 'Bản đồ cần ít nhất hai khung.';
      for (const panel of panels) {
        if (!isRecord(panel) || !Array.isArray(panel.items) || panel.items.length === 0) {
          return 'Khung bản đồ không có ô nào.';
        }
        for (const item of panel.items) {
          if (!isRecord(item)) return 'Ô bản đồ không hợp lệ.';

          // Đọc từng trường một để TypeScript thu hẹp được kiểu. Kiểm cả cụm
          // bằng `[x, y, w, h].every(...)` thì compiler không suy ra được từng
          // biến là number, nên phép so sánh bên dưới sẽ đỏ.
          const x = numberField(item, 'x');
          const y = numberField(item, 'y');
          const w = numberField(item, 'w');
          const h = numberField(item, 'h');
          if (x === null || y === null || w === null || h === null) {
            return 'Ô bản đồ thiếu toạ độ.';
          }

          // Nới 0.0001 để số thập phân làm tròn không bị coi là tràn khung.
          if (x < 0 || y < 0 || x + w > 1.0001 || y + h > 1.0001) {
            return `Ô "${String(item.label)}" nằm ngoài khung 0–1.`;
          }
        }
      }
      return null;
    }

    default:
      return `kind không hợp lệ: ${String(data.kind)}`;
  }
}

function checkAnalysisKey(key: unknown): string | null {
  if (!isRecord(key)) return 'Thiếu analysisKey.';

  for (const field of ['trends', 'extremes', 'crossings'] as const) {
    if (!Array.isArray(key[field])) return `analysisKey.${field} phải là mảng.`;
  }

  const grouping = key.grouping;
  if (!Array.isArray(grouping) || grouping.length !== 2) {
    return 'analysisKey.grouping phải có đúng hai nhóm, vì hai nhóm là hai đoạn thân bài.';
  }
  if (!grouping.every((g) => Array.isArray(g) && g.length > 0)) {
    return 'analysisKey.grouping có nhóm rỗng.';
  }

  if ((key.trends as unknown[]).length === 0) {
    return 'analysisKey.trends rỗng — đề không có xu hướng nào để mô tả.';
  }
  return null;
}

/** Trả về số hữu hạn, hoặc null nếu trường thiếu / không phải số / là NaN. */
function numberField(o: Record<string, unknown>, key: string): number | null {
  const v = o[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
