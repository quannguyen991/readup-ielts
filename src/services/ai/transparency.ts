/**
 * Cắt nền trắng của ảnh sinh ra thành vùng trong suốt.
 *
 * VÌ SAO PHẢI LÀM BẰNG CODE: model sinh ảnh không xuất được alpha. Bảo nó "nền
 * trong suốt" thì nó vẽ luôn cái bàn cờ ca-rô — ký hiệu quy ước của vùng trong
 * suốt — thành một ô vuông nằm chình ình giữa ảnh. Đã dính đúng lỗi đó. Nên
 * cách chắc chắn là bắt model vẽ trên NỀN TRẮNG PHẲNG, rồi tự bóc nền ra.
 *
 * VÌ SAO LOANG TỪ MÉP CHỨ KHÔNG XOÁ MỌI PIXEL TRẮNG: trong ảnh có những mảng
 * trắng THUỘC VỀ hình — trang sách, mặt đồng hồ, vệt sáng trên vật thể. Xoá theo
 * màu sẽ đục thủng chính chủ thể. Loang từ mép vào chỉ ăn phần trắng NỐI LIỀN
 * với viền ảnh, nên vùng trắng nằm lọt trong hình vẫn còn nguyên.
 */

export type StripOptions = {
  /** Sai khác màu tối đa so với màu nền lấy mẫu, theo tổng chênh 3 kênh. */
  tolerance?: number;
  /** Bề rộng dải chuyển tiếp ở rìa, tính bằng pixel. */
  feather?: number;
};

/**
 * Đoán màu nền bằng cách lấy mẫu ngay tại bốn góc.
 *
 * VÌ SAO KHÔNG DÙNG MỘT NGƯỠNG "TRẮNG" CỐ ĐỊNH: model không phải lúc nào cũng
 * vẽ nền trắng. Có tấm nó vẽ nền xanh rất nhạt (235,245,253) — bảo là trắng thì
 * trượt, mà nới ngưỡng trắng cho vừa nó thì lại nuốt luôn màu `#DBE7FE` trong
 * bảng màu của app, tức là ăn mất chi tiết xanh nhạt của những ảnh khác.
 *
 * Lấy mẫu từ chính ảnh thì mỗi tấm tự có ngưỡng của nó, và ngưỡng ấy luôn khớp
 * với nền thật chứ không phải nền ta giả định.
 *
 * Trả về `null` khi bốn góc không đồng màu — nền có hoạ tiết hoặc ảnh tràn viền,
 * cả hai đều là lúc không nên bóc gì cả.
 */
function sampleBackground(
  rgba: Uint8Array,
  width: number,
  height: number,
): { color: [number, number, number]; spread: number } | null {
  const corners: [number, number][] = [
    [1, 1],
    [width - 2, 1],
    [1, height - 2],
    [width - 2, height - 2],
  ];

  /*
    Bỏ qua góc ĐÃ TRONG SUỐT.

    Chạy bóc nền lần hai trên cùng một ảnh là chuyện bình thường — luật bóc được
    sửa thì phải quét lại cả bộ. Nhưng lần một đã đặt alpha = 0 ở góc, và bộ mã
    hoá PNG thường xoá luôn RGB của pixel trong suốt thành đen; đọc góc đó sẽ ra
    "nền tối" và cả ảnh bị từ chối oan. Đã gặp đúng thế với hai tấm mới bóc được
    một nửa ở lần một.
  */
  const samples = corners
    .map(([x, y]) => (y * width + x) * 4)
    .filter((p) => rgba[p + 3]! > 0)
    .map((p) => [rgba[p]!, rgba[p + 1]!, rgba[p + 2]!] as [number, number, number]);

  /*
    Bốn góc đều trong suốt: ảnh ĐÃ được bóc một lần rồi.

    Vẫn có việc để làm — chạy lại với dung sai nới tay để ăn nốt phần nền mà lần
    trước không với tới (ví dụ tấm giấy kẻ ô bị các đường kẻ chặn đường loang).
    Lúc này không còn góc nào để lấy mẫu, nên lấy trắng làm chuẩn: ảnh nào cũng
    được sinh trên nền sáng, và phần sót lại luôn là phần sáng ấy.
  */
  if (samples.length === 0) return { color: [255, 255, 255], spread: 0 };

  /*
    Lấy TRUNG BÌNH bốn góc, và đo luôn độ lệch lớn nhất so với trung bình.

    Bản trước đòi bốn góc phải gần như trùng màu, và nó từ chối một tấm có nền
    CHUYỂN SẮC: góc trên xám (207,208,209), góc dưới gần trắng (247,247,248).
    Nền như thế vẫn là nền phẳng theo nghĩa cần thiết ở đây — không có hoạ tiết,
    không có chủ thể chạm viền — chỉ là nó đi từ sắc này sang sắc kia.

    Nên thay vì từ chối, lấy tâm là trung bình rồi NỚI DUNG SAI ĐÚNG BẰNG độ
    lệch đo được. Nền chuyển sắc nhẹ thì lọt; nền có hoạ tiết thật thì độ lệch
    vọt lên và vẫn bị chặn ở ngưỡng dưới.
  */
  const mean: [number, number, number] = [0, 1, 2].map((c) =>
    Math.round(samples.reduce((sum, s) => sum + s[c]!, 0) / samples.length),
  ) as [number, number, number];

  const spread = Math.max(...samples.map((s) => distance(s, mean)));
  if (spread > 90) return null;

  // Nền phải SÁNG. Ảnh chụp nền tối cũng có bốn góc đồng màu, mà bóc nền ảnh
  // chụp là hỏng ảnh — chặn ở đây rẻ hơn chặn ở chỗ gọi.
  if (Math.min(...mean) < 200) return null;

  return { color: mean, spread };
}

function distance(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

/**
 * Xoá nền nối liền với mép ảnh, sửa `rgba` tại chỗ.
 *
 * `rgba` là mảng RGBA phẳng, 4 byte một pixel — đúng định dạng `pngjs` trả về.
 * Trả về số pixel đã chuyển thành trong suốt, để bên gọi biết có ăn nhầm cả ảnh
 * hay không xoá được gì.
 */
export function stripWhiteBackground(
  rgba: Uint8Array,
  width: number,
  height: number,
  options: StripOptions = {},
): number {
  const tolerance = options.tolerance ?? 26;
  const feather = options.feather ?? 2;

  if (width <= 0 || height <= 0) return 0;

  const sampled = sampleBackground(rgba, width, height);
  if (!sampled) return 0;

  // Dung sai phải trùm được cả độ lệch của nền, cộng một biên nhỏ cho nhiễu.
  const limit = Math.max(tolerance, sampled.spread + 20);
  const background = sampled.color;

  const total = width * height;
  const isBackground = new Uint8Array(total);

  /*
    Loang bằng NGĂN XẾP TỰ QUẢN, không đệ quy.

    Ảnh 1024x1024 là hơn một triệu pixel; gọi đệ quy trên nền trắng lớn sẽ tràn
    ngăn xếp của Node và chết giữa chừng — mà chết ở đây nghĩa là ảnh hỏng được
    upload lên như thường.
  */
  const stack: number[] = [];

  const consider = (index: number) => {
    if (isBackground[index]) return;
    const p = index * 4;
    // Pixel đã trong suốt là nền theo định nghĩa, và phải cho nó dẫn đường tiếp:
    // không thế thì vùng bóc dở của lần trước chặn mất đường loang của lần này.
    if (rgba[p + 3] === 0) {
      isBackground[index] = 1;
      stack.push(index);
      return;
    }
    const pixel: [number, number, number] = [rgba[p]!, rgba[p + 1]!, rgba[p + 2]!];
    if (distance(pixel, background) > limit) return;
    isBackground[index] = 1;
    stack.push(index);
  };

  for (let x = 0; x < width; x += 1) {
    consider(x);
    consider((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    consider(y * width);
    consider(y * width + width - 1);
  }

  while (stack.length > 0) {
    const index = stack.pop()!;
    const x = index % width;
    const y = (index - x) / width;

    if (x > 0) consider(index - 1);
    if (x < width - 1) consider(index + 1);
    if (y > 0) consider(index - width);
    if (y < height - 1) consider(index + width);
  }

  let cleared = 0;
  for (let i = 0; i < total; i += 1) {
    if (isBackground[i]) {
      rgba[i * 4 + 3] = 0;
      cleared += 1;
    }
  }

  if (feather > 0) featherEdges(rgba, isBackground, width, height, feather);

  return cleared;
}

/**
 * Làm mềm rìa cắt.
 *
 * Cắt thẳng theo ngưỡng để lại viền răng cưa, và trên nền tối thì viền trắng ấy
 * hiện rõ như đường cắt bằng kéo. Pixel càng gần vùng nền càng bớt đục, nên rìa
 * tan dần thay vì dừng đột ngột.
 */
function featherEdges(
  rgba: Uint8Array,
  isBackground: Uint8Array,
  width: number,
  height: number,
  feather: number,
): void {
  const total = width * height;
  // Số bước từ pixel tới vùng nền gần nhất. Tên khác `distance()` ở trên có chủ
  // ý: một cái đo khoảng cách MÀU, một cái đo khoảng cách KHÔNG GIAN.
  const steps = new Int16Array(total).fill(-1);
  let frontier: number[] = [];

  for (let i = 0; i < total; i += 1) {
    if (isBackground[i]) {
      steps[i] = 0;
      frontier.push(i);
    }
  }

  for (let step = 1; step <= feather && frontier.length > 0; step += 1) {
    const next: number[] = [];

    for (const index of frontier) {
      const x = index % width;
      const y = (index - x) / width;

      const push = (n: number) => {
        if (steps[n] !== -1) return;
        steps[n] = step;
        next.push(n);
      };

      if (x > 0) push(index - 1);
      if (x < width - 1) push(index + 1);
      if (y > 0) push(index - width);
      if (y < height - 1) push(index + width);
    }

    frontier = next;
  }

  for (let i = 0; i < total; i += 1) {
    const d = steps[i]!;
    if (d <= 0) continue;
    // d = feather → giữ nguyên; d = 1 → mờ nhất. Chia đều theo số bước.
    const alpha = Math.round((d / (feather + 1)) * 255);
    if (alpha < rgba[i * 4 + 3]!) rgba[i * 4 + 3] = alpha;
  }
}
