import assert from 'node:assert/strict';
import { test } from 'node:test';

import { stripWhiteBackground } from './transparency';

/** Dựng ảnh RGBA đặc, tô bằng hàm cho từng toạ độ. */
function make(w: number, h: number, paint: (x: number, y: number) => [number, number, number]) {
  const rgba = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const [r, g, b] = paint(x, y);
      const p = (y * w + x) * 4;
      rgba[p] = r;
      rgba[p + 1] = g;
      rgba[p + 2] = b;
      rgba[p + 3] = 255;
    }
  }
  return rgba;
}

const alphaAt = (rgba: Uint8Array, w: number, x: number, y: number) => rgba[(y * w + x) * 4 + 3]!;

test('nền trắng quanh hình bị xoá, hình giữ nguyên', () => {
  // Ô vuông xanh 4x4 giữa ảnh 12x12 trắng.
  const inside = (x: number, y: number) => x >= 4 && x < 8 && y >= 4 && y < 8;
  const rgba = make(12, 12, (x, y) => (inside(x, y) ? [37, 99, 235] : [255, 255, 255]));

  stripWhiteBackground(rgba, 12, 12, { feather: 0 });

  assert.equal(alphaAt(rgba, 12, 0, 0), 0, 'góc ảnh phải trong suốt');
  assert.equal(alphaAt(rgba, 12, 6, 6), 255, 'giữa hình phải đục');
});

test('vùng trắng NẰM TRONG hình không bị xoá', () => {
  /*
    Ca quan trọng nhất. Trang sách, mặt đồng hồ, vệt sáng đều là mảng trắng
    thuộc về hình. Xoá theo màu thay vì loang từ mép sẽ đục thủng chính chủ thể,
    và lỗi đó chỉ lộ ra khi ảnh nằm trên nền tối.
  */
  const border = (x: number, y: number) => x >= 3 && x < 9 && y >= 3 && y < 9;
  const hole = (x: number, y: number) => x >= 5 && x < 7 && y >= 5 && y < 7;
  const rgba = make(12, 12, (x, y) =>
    hole(x, y) ? [255, 255, 255] : border(x, y) ? [37, 99, 235] : [255, 255, 255],
  );

  stripWhiteBackground(rgba, 12, 12, { feather: 0 });

  assert.equal(alphaAt(rgba, 12, 0, 0), 0, 'nền ngoài vẫn phải xoá');
  assert.equal(alphaAt(rgba, 12, 5, 5), 255, 'lỗ trắng bên trong phải giữ');
});

test('màu nhạt nhưng CÓ MÀU thì không tính là nền', () => {
  // Lavender #C4ADF8 sáng, nhưng nó là màu của hình chứ không phải nền.
  const rgba = make(6, 6, () => [196, 173, 248]);
  assert.equal(stripWhiteBackground(rgba, 6, 6, { feather: 0 }), 0);
  assert.equal(alphaAt(rgba, 6, 0, 0), 255);
});

test('nền trắng hơi lấm tấm vẫn xoá được', () => {
  // Model vẽ nền không bao giờ đúng 255 tuyệt đối.
  const rgba = make(8, 8, (x, y) => [250 + ((x + y) % 5), 249 + ((x * y) % 6), 251], );
  assert.ok(stripWhiteBackground(rgba, 8, 8, { feather: 0 }) > 0);
});

test('ảnh đặc không có nền thì không xoá gì', () => {
  const rgba = make(8, 8, () => [37, 99, 235]);
  assert.equal(stripWhiteBackground(rgba, 8, 8, { feather: 0 }), 0);
});

test('làm mềm rìa: pixel sát nền mờ hơn pixel sâu bên trong', () => {
  const inside = (x: number, y: number) => x >= 4 && x < 12 && y >= 4 && y < 12;
  const rgba = make(16, 16, (x, y) => (inside(x, y) ? [37, 99, 235] : [255, 255, 255]));

  stripWhiteBackground(rgba, 16, 16, { feather: 2 });

  const rim = alphaAt(rgba, 16, 4, 8);
  const core = alphaAt(rgba, 16, 8, 8);
  assert.ok(rim < core, `rìa (${rim}) phải mờ hơn lõi (${core})`);
  assert.equal(core, 255, 'lõi không được đụng tới');
});

test('ảnh rỗng không làm chương trình chết', () => {
  assert.equal(stripWhiteBackground(new Uint8Array(0), 0, 0), 0);
});

test('nền trắng toàn bộ thì xoá sạch, không kẹt vòng lặp', () => {
  const rgba = make(20, 20, () => [255, 255, 255]);
  assert.equal(stripWhiteBackground(rgba, 20, 20, { feather: 0 }), 400);
});

test('icon nét mảnh: bóc hơn 90% nền vẫn phải giữ được nét', () => {
  // Ca này từng bị chặn nhầm. Icon 32x32 chỉ có một đường ngang 1px: nền chiếm
  // 96,9% ảnh, và đó là chuyện bình thường của line-art chứ không phải hỏng.
  const rgba = make(32, 32, (x, y) => (y === 16 && x > 3 && x < 28 ? [37, 99, 235] : [255, 255, 255]));
  const cleared = stripWhiteBackground(rgba, 32, 32, { feather: 0 });

  assert.ok(cleared / (32 * 32) > 0.9, 'phải bóc được phần lớn ảnh');
  assert.equal(alphaAt(rgba, 32, 16, 16), 255, 'nét vẽ phải còn nguyên');
});

test('nền xanh rất nhạt cũng bóc được, không chỉ nền trắng', () => {
  /*
    Ca có thật: một illustration được model vẽ trên nền (235,245,253) thay vì
    trắng. Luật "trắng" cũ trượt nó, mà nới luật trắng cho vừa thì lại nuốt màu
    #DBE7FE trong bảng màu app. Lấy mẫu màu nền từ chính ảnh giải được cả hai.
  */
  const inside = (x: number, y: number) => x >= 4 && x < 8 && y >= 4 && y < 8;
  const rgba = make(12, 12, (x, y) => (inside(x, y) ? [37, 99, 235] : [235, 245, 253]));

  stripWhiteBackground(rgba, 12, 12, { feather: 0 });

  assert.equal(alphaAt(rgba, 12, 0, 0), 0, 'nền xanh nhạt phải bị bóc');
  assert.equal(alphaAt(rgba, 12, 6, 6), 255, 'hình phải còn');
});

test('nền tương phản mạnh giữa các góc thì không bóc gì', () => {
  /*
    Ranh giới của luật lấy mẫu: nền CHUYỂN SẮC NHẸ thì chấp nhận (xem ca
    notes-hero bên dưới), nhưng góc này trắng góc kia xám đậm thì đó không còn
    là nền phẳng — nhiều khả năng ảnh tràn viền hoặc nền có hoạ tiết, và bóc
    trong hai trường hợp đó đều làm hỏng ảnh.
  */
  const rgba = make(12, 12, (x) => (x < 6 ? [255, 255, 255] : [150, 152, 155]));
  assert.equal(stripWhiteBackground(rgba, 12, 12, { feather: 0 }), 0);
});

test('ảnh nền tối không bị bóc nhầm', () => {
  // Ảnh chụp có bốn góc đồng màu tối; bóc nền ảnh chụp là làm hỏng ảnh.
  const rgba = make(12, 12, () => [30, 34, 40]);
  assert.equal(stripWhiteBackground(rgba, 12, 12, { feather: 0 }), 0);
});

test('nền chuyển sắc từ xám sang trắng vẫn bóc được', () => {
  // Ca có thật: notes-hero có góc trên (207,208,209), góc dưới (247,247,248).
  const inside = (x: number, y: number) => x >= 6 && x < 10 && y >= 6 && y < 10;
  const rgba = make(16, 16, (x, y) => {
    if (inside(x, y)) return [37, 99, 235];
    const v = 207 + Math.round((y / 15) * 40);
    return [v, v, v + 1];
  });

  stripWhiteBackground(rgba, 16, 16, { feather: 0 });

  assert.equal(alphaAt(rgba, 16, 0, 0), 0, 'góc xám phải bóc');
  assert.equal(alphaAt(rgba, 16, 15, 15), 0, 'góc trắng phải bóc');
  assert.equal(alphaAt(rgba, 16, 8, 8), 255, 'hình phải còn');
});

test('chạy lại trên ảnh đã bóc dở thì bóc nốt phần còn lại', () => {
  /*
    Ca có thật: hai illustration được bóc bằng luật cũ chỉ ăn được nửa trên. Lần
    hai, góc đã trong suốt (và RGB bị bộ mã hoá xoá thành đen) làm bộ lấy mẫu
    tưởng là ảnh nền tối rồi từ chối cả tấm.
  */
  const inside = (x: number, y: number) => x >= 6 && x < 10 && y >= 6 && y < 10;
  const rgba = make(16, 16, (x, y) => (inside(x, y) ? [37, 99, 235] : [252, 252, 252]));

  // Giả lập lần bóc trước: nửa trên đã trong suốt và RGB bị xoá về đen.
  for (let y = 0; y < 5; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const p = (y * 16 + x) * 4;
      rgba[p] = 0;
      rgba[p + 1] = 0;
      rgba[p + 2] = 0;
      rgba[p + 3] = 0;
    }
  }

  stripWhiteBackground(rgba, 16, 16, { feather: 0 });

  assert.equal(alphaAt(rgba, 16, 8, 15), 0, 'nền dưới phải bóc nốt');
  assert.equal(alphaAt(rgba, 16, 8, 8), 255, 'hình vẫn phải còn');
});

test('ảnh đã bóc hết góc: chạy lại với dung sai nới tay vẫn ăn được phần sót', () => {
  /*
    Ca có thật: math-hero còn một tấm giấy kẻ ô trắng làm phông, bị các đường kẻ
    xanh nhạt chặn nên lần bóc đầu không với tới. Chạy lại thì bốn góc đã trong
    suốt, không còn gì lấy mẫu — phải lùi về trắng thì mới bóc tiếp được.
  */
  const rgba = make(16, 16, (x, y) => {
    if (x >= 7 && x < 10 && y >= 7 && y < 10) return [37, 99, 235]; // chủ thể
    if (x === 5 || x === 11) return [205, 218, 240]; // đường kẻ chặn đường loang
    return [252, 252, 252]; // giấy trắng
  });

  // Lần bóc trước: viền ngoài đã trong suốt, RGB bị xoá về đen.
  for (let i = 0; i < 16 * 16; i += 1) {
    const x = i % 16;
    const y = (i - x) / 16;
    if (x > 2 && x < 13 && y > 2 && y < 13) continue;
    const p = i * 4;
    rgba[p] = 0;
    rgba[p + 1] = 0;
    rgba[p + 2] = 0;
    rgba[p + 3] = 0;
  }

  stripWhiteBackground(rgba, 16, 16, { feather: 0, tolerance: 110 });

  assert.equal(alphaAt(rgba, 16, 8, 4), 0, 'giấy trắng phải bóc nốt');
  assert.equal(alphaAt(rgba, 16, 8, 8), 255, 'chủ thể phải còn');
});
