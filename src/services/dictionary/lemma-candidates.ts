/**
 * Các dạng gốc CÓ THỂ của một từ chia, theo thứ tự đáng thử.
 *
 * `lemmatize` chỉ đoán MỘT dạng, và đoán sai ở những từ tận cùng -e: "enhanced"
 * ra "enhanc", "enhances" ra "enhanc". Tra từ điển thì không cần đoán đúng — chỉ
 * cần thử lần lượt các ứng viên và lấy cái đầu tiên có mục. Hàm thuần, test được.
 */
export function lemmaCandidates(raw: string): string[] {
  const w = raw
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/'s$/, '')
    .replace(/^['-]+|['-]+$/g, '')
    .replace(/[^a-z'-]/g, '');
  if (!w) return [];

  const out: string[] = [w];
  const add = (s: string) => {
    if (s.length >= 2 && !out.includes(s)) out.push(s);
  };
  const stems = (stem: string) => {
    add(stem);
    add(`${stem}e`);
    // "running" → "runn" → "run"
    if (/([^aeiou])\1$/.test(stem)) add(stem.slice(0, -1));
    // "studied/studying" → "study"
    if (stem.endsWith('i')) add(`${stem.slice(0, -1)}y`);
  };

  if (w.length > 3) {
    if (w.endsWith('ies')) add(`${w.slice(0, -3)}y`);
    if (w.endsWith('ied')) add(`${w.slice(0, -3)}y`);
    if (w.endsWith('ves')) {
      add(`${w.slice(0, -3)}f`);
      add(`${w.slice(0, -3)}fe`);
    }
    if (w.endsWith('es')) add(w.slice(0, -2));
    if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1));
    if (w.endsWith('ing') && w.length > 5) stems(w.slice(0, -3));
    if (w.endsWith('ed') && w.length > 4) stems(w.slice(0, -2));
    if (w.endsWith('ly') && w.length > 4) add(w.slice(0, -2));
    if (w.endsWith('er') && w.length > 4) stems(w.slice(0, -2));
    if (w.endsWith('est') && w.length > 5) stems(w.slice(0, -3));
  }
  return out;
}
