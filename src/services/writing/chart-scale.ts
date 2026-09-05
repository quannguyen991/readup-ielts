/**
 * Hình học biểu đồ, tách khỏi component để test được.
 *
 * Component React trong dự án này chưa có bộ test nào chạy được (không có
 * react-test-renderer), nên mọi thứ đáng kiểm phải nằm ở đây. Phần còn lại của
 * component chỉ là nhận số đã tính rồi vẽ ra SVG.
 */

/** Bước nhảy "đẹp" theo mắt người: 1, 2, 2.5, 5 rồi nhân 10. */
const NICE_STEPS = [1, 2, 2.5, 5, 10];

/**
 * Chia vạch trục thành những con số tròn.
 *
 * Chia đều máy móc `(max - min) / 5` ra những vạch kiểu 33.33 — người đọc phải
 * dừng lại nhẩm, mà biểu đồ trong đề thi thì phải liếc là thấy giá trị.
 */
export function niceTicks(min: number, max: number, target = 5): number[] {
  // Min bằng max (mọi giá trị như nhau) thì không có biên độ nào để chia.
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    const base = Number.isFinite(max) ? max : 0;
    return [base, base + 1];
  }

  const raw = (max - min) / target;
  const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
  const step =
    (NICE_STEPS.find((m) => m * magnitude >= raw) ?? NICE_STEPS[NICE_STEPS.length - 1] ?? 10) *
    magnitude;

  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;

  // Nhân theo chỉ số thay vì cộng dồn: cộng dồn số thực tích luỹ sai số và ra
  // những vạch kiểu 0.30000000000000004.
  const count = Math.round((hi - lo) / step);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i += 1) ticks.push(round(lo + step * i));
  return ticks;
}

function round(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/**
 * Biên độ chung của mọi chuỗi.
 *
 * Ép trục về 0 khi mọi giá trị đều dương: trục cắt ở giá trị nhỏ nhất làm cột
 * thấp trông như bằng 0, và đó là kiểu bóp méo tỷ lệ mà đề thi thật không có.
 * Có giá trị âm (nhiệt độ chẳng hạn) thì giữ nguyên cận dưới thật.
 */
export function seriesExtent(series: { values: number[] }[]): { min: number; max: number } {
  const all = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  if (all.length === 0) return { min: 0, max: 1 };

  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const min = rawMin >= 0 ? 0 : rawMin;
  // Mọi giá trị bằng nhau và bằng 0 thì vẫn phải có biên độ để chia trục.
  return { min, max: rawMax > min ? rawMax : min + 1 };
}

export type PieArc = {
  label: string;
  value: number;
  /** Độ, tính từ 12 giờ theo chiều kim đồng hồ. */
  startAngle: number;
  endAngle: number;
};

export function pieSlices(slices: { label: string; value: number }[]): PieArc[] {
  const total = slices.reduce((s, x) => s + Math.max(0, x.value), 0);
  if (total <= 0) return [];

  const out: PieArc[] = [];
  let angle = 0;
  for (const slice of slices) {
    const sweep = (Math.max(0, slice.value) / total) * 360;
    out.push({
      label: slice.label,
      value: slice.value,
      startAngle: round(angle),
      endAngle: round(angle + sweep),
    });
    angle += sweep;
  }
  return out;
}

/** Toạ độ một điểm trên đường tròn, tính từ 12 giờ theo chiều kim đồng hồ. */
export function polarPoint(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

/** Đường path SVG của một lát bánh. */
export function arcPath(cx: number, cy: number, radius: number, arc: PieArc): string {
  const sweep = arc.endAngle - arc.startAngle;
  // Lát chiếm trọn vòng tròn không vẽ bằng cung được (điểm đầu trùng điểm cuối),
  // nên vẽ thành hai nửa.
  if (sweep >= 359.999) {
    const a = polarPoint(cx, cy, radius, 0);
    const b = polarPoint(cx, cy, radius, 180);
    return `M ${a.x} ${a.y} A ${radius} ${radius} 0 1 1 ${b.x} ${b.y} A ${radius} ${radius} 0 1 1 ${a.x} ${a.y} Z`;
  }

  const start = polarPoint(cx, cy, radius, arc.startAngle);
  const end = polarPoint(cx, cy, radius, arc.endAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}
