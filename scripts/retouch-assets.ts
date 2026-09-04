/**
 * Bóc nền trắng của những tài nguyên ĐÃ SINH, ngay trên Supabase Storage.
 *
 *   npx tsx --env-file=.env.local scripts/retouch-assets.ts
 *   npx tsx --env-file=.env.local scripts/retouch-assets.ts --key illustration/practice-hero
 *
 * VÌ SAO CÓ SCRIPT NÀY THAY VÌ SINH LẠI: ảnh đã sinh xong đều nằm trên một ô
 * trắng, và ô đó lộ rõ khi ảnh được đặt lên banner gradient. Sinh lại thì tốn
 * tiền và mất khoảng nửa tiếng cho cả bộ; mà phần cần sửa lại nằm hoàn toàn ở
 * khâu hậu kỳ, không phải ở khâu vẽ. Tải về, bóc nền, đẩy lên lại là xong —
 * chạy được cả khi tài khoản sinh ảnh hết quota.
 *
 * Ảnh chụp (topic thumbnail) KHÔNG đụng tới: nền của chúng là bầu trời, bức
 * tường, mặt bàn — bóc đi là thủng ảnh.
 */
import { PNG } from 'pngjs';

import { makeBackgroundTransparent } from '../src/services/ai/png';
import { ASSET_BUCKET, getSupabaseAdmin } from '../src/lib/supabase-admin';

const RETOUCHABLE = ['nav_icon', 'question_icon', 'illustration'];

async function main(): Promise<void> {
  const only = readFlag('--key');

  /*
    Dung sai nới tay, dùng cho ảnh có PHÔNG NỀN VẼ SẴN.

    Ví dụ thật: math-hero có một tấm giấy kẻ ô làm phông phía sau. Giấy thì
    trắng như nền, nhưng các đường kẻ xanh nhạt chặn đường loang, nên phần trắng
    bên trong lưới không nối được ra mép và còn lại thành mảng rách. Nới dung sai
    cho vượt qua được đường kẻ thì bóc nốt được cả tấm giấy.

    KHÔNG đặt làm mặc định: nới tay trên ảnh thường sẽ ăn vào chi tiết sáng của
    chính chủ thể.
  */
  const tolerance = Number(readFlag('--tolerance') ?? 0) || undefined;

  /*
    `--reset`: trả alpha về 255 rồi bóc lại bằng dung sai mặc định.

    Cần vì bóc nền GHI ĐÈ file gốc, mà một lần nới dung sai quá tay thì ăn mất
    chi tiết của chủ thể — đã xảy ra thật với math-hero, dung sai 110 nuốt luôn
    cây thước. Cứu được là nhờ một chi tiết may mắn: đặt alpha = 0 KHÔNG xoá RGB,
    nên màu của pixel bị bóc vẫn còn nguyên dưới lớp trong suốt và dựng lại được.

    Đây là đường lùi, không phải giấy phép nới tay bừa: có ảnh mà không dung sai
    nào đúng cả — math-hero có đường kẻ lưới lệch 102 còn cây thước chỉ lệch
    60-79, nên bất kỳ ngưỡng nào qua được lưới đều ăn mất thước. Ảnh như thế phải
    sinh lại bằng prompt khác, không chữa được ở khâu hậu kỳ.
  */
  const reset = process.argv.includes('--reset');
  const supabase = getSupabaseAdmin();

  const query = supabase.from('generated_assets').select('*').in('kind', RETOUCHABLE);
  const { data, error } = only ? await query.eq('cache_key', only) : await query;

  if (error) throw new Error(`Đọc danh sách tài nguyên thất bại: ${error.message}`);

  const assets = data ?? [];
  console.log(`Sẽ bóc nền ${assets.length} tài nguyên.\n`);

  let done = 0;
  let skipped = 0;

  for (const asset of assets) {
    const path = `${asset.cache_key}.png`;

    const { data: file, error: downloadError } = await supabase.storage
      .from(ASSET_BUCKET)
      .download(path);

    if (downloadError || !file) {
      console.log(`✗ ${asset.cache_key}: tải về lỗi — ${downloadError?.message ?? 'không có file'}`);
      continue;
    }

    let original: Uint8Array = new Uint8Array(await file.arrayBuffer());
    if (reset) original = restoreAlpha(original);

    const cut = await makeBackgroundTransparent(original, tolerance ? { tolerance } : {});

    if (!cut) {
      // `makeBackgroundTransparent` tự từ chối khi bóc được quá ít hoặc quá
      // nhiều — cả hai đều là dấu hiệu ảnh không hợp để bóc.
      console.log(`- ${asset.cache_key}: bỏ qua (không có nền phẳng để bóc)`);
      skipped += 1;
      continue;
    }

    /*
      GIỮ MỘT BẢN GỐC trước khi ghi đè, và chỉ giữ LẦN ĐẦU.

      Script này ghi đè thẳng lên file trong Storage, không có lịch sử phiên bản.
      Một lần chạy sai tham số là mất ảnh gốc — đã suýt mất math-hero vì dung sai
      quá tay, cứu được chỉ nhờ alpha = 0 không xoá RGB, một sự may mắn chứ không
      phải thiết kế.

      `upsert: false` là phần quan trọng nhất: chạy lần hai KHÔNG được đè bản gốc
      bằng bản đã bóc, nếu không thì bản lưu chẳng còn là bản gốc nữa.
    */
    await supabase.storage
      .from(ASSET_BUCKET)
      .upload(`${asset.cache_key}.orig.png`, original, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '31536000',
      });

    const { error: uploadError } = await supabase.storage
      .from(ASSET_BUCKET)
      .upload(path, cut.bytes, { contentType: 'image/png', upsert: true, cacheControl: '31536000' });

    if (uploadError) {
      console.log(`✗ ${asset.cache_key}: đẩy lên lỗi — ${uploadError.message}`);
      continue;
    }

    console.log(`✓ ${asset.cache_key}: bóc ${cut.clearedPercent.toFixed(0)}% pixel`);
    done += 1;
  }

  console.log(`\nXong. Đã bóc ${done} · bỏ qua ${skipped}.`);

  if (done > 0) {
    /*
      Ảnh đặt cache một năm nên trình duyệt sẽ giữ bản cũ.

      Không đổi được URL vì URL nằm trong DB và trong cache của người dùng, nên
      cách chắc chắn là nói ra để còn tự tay xoá cache khi kiểm.
    */
    console.log('Ảnh cache 1 năm — mở bằng Ctrl+F5 hoặc thêm ?v=2 vào URL khi kiểm mắt.');
  }
}

/** Đặt alpha = 255 cho mọi pixel, đưa ảnh về trạng thái chưa bóc nền lần nào. */
function restoreAlpha(bytes: Uint8Array): Uint8Array {
  const png = PNG.sync.read(Buffer.from(bytes));
  for (let i = 3; i < png.data.length; i += 4) png.data[i] = 255;
  return new Uint8Array(PNG.sync.write(png));
}

function readFlag(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
