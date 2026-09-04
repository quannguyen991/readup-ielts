import { generateImage } from './images';
import { makeBackgroundTransparent } from './png';
import type { AssetSpec } from './asset-catalog';
import { ASSET_BUCKET, getSupabaseAdmin } from '@/lib/supabase-admin';
import type { GeneratedAsset } from '@/types/database';

export type EnsureAssetResult = {
  asset: GeneratedAsset;
  /** true nếu lấy từ cache, false nếu vừa sinh mới. */
  cached: boolean;
};

type EnsureOptions = {
  /** Bỏ qua cache và sinh lại — chỉ dùng khi cố ý làm mới. */
  force?: boolean;
  log?: (message: string) => void;
};

/**
 * Lấy tài nguyên từ cache, hoặc sinh mới → upload Supabase Storage → ghi bảng
 * generated_assets. Đây là cửa duy nhất để sinh ảnh, nên không bao giờ có
 * chuyện gọi lại API mỗi lần render.
 */
export async function ensureAsset(
  spec: AssetSpec,
  options: EnsureOptions = {},
): Promise<EnsureAssetResult> {
  const { force = false, log } = options;
  const supabase = getSupabaseAdmin();

  if (!force) {
    const { data: existing, error } = await supabase
      .from('generated_assets')
      .select('*')
      .eq('cache_key', spec.key)
      .maybeSingle();

    if (error) throw new Error(`Đọc cache tài nguyên thất bại: ${error.message}`);
    if (existing) return { asset: existing, cached: true };
  }

  log?.(`  → sinh mới ${spec.key} (${spec.size})`);
  const image = await generateImage(spec.prompt, spec.size, {
    label: spec.key,
    onRetry: (msg) => log?.(msg),
  });

  /*
    Bóc nền trắng cho icon và illustration; ẢNH CHỤP THÌ KHÔNG.

    Thumbnail chủ đề là ảnh chụp thật, nền của nó là bầu trời hay bức tường —
    bóc đi thì thủng ảnh. Chỉ hai loại vẽ trên nền trắng phẳng mới cần, và chúng
    cũng là hai loại được đặt lên nền màu (banner gradient, thẻ có tô nền), tức
    là hai loại mà cái ô trắng lộ ra rõ nhất.
  */
  if (spec.kind === 'nav_icon' || spec.kind === 'question_icon' || spec.kind === 'illustration') {
    const cut = await makeBackgroundTransparent(image.bytes);
    if (cut) {
      log?.(`    ✂ bóc nền ${spec.key}: ${cut.clearedPercent.toFixed(0)}% pixel`);
      image.bytes = cut.bytes;
    }
  }

  const storagePath = `${spec.key}.png`;
  const { error: uploadError } = await supabase.storage
    .from(ASSET_BUCKET)
    .upload(storagePath, image.bytes, {
      contentType: image.contentType,
      upsert: true,
      cacheControl: '31536000',
    });

  if (uploadError) throw new Error(`Upload ${storagePath} thất bại: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage.from(ASSET_BUCKET).getPublicUrl(storagePath);

  const { data: saved, error: insertError } = await supabase
    .from('generated_assets')
    .upsert(
      {
        kind: spec.kind,
        cache_key: spec.key,
        prompt: spec.prompt,
        model: image.model,
        storage_path: storagePath,
        public_url: publicUrlData.publicUrl,
        width: image.width,
        height: image.height,
      },
      { onConflict: 'cache_key' },
    )
    .select()
    .single();

  if (insertError) throw new Error(`Ghi generated_assets thất bại: ${insertError.message}`);

  return { asset: saved, cached: false };
}

/** Đọc toàn bộ tài nguyên đã cache — client dùng để map key → URL. */
export async function listCachedAssets(): Promise<GeneratedAsset[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('generated_assets')
    .select('*')
    .order('cache_key', { ascending: true });

  if (error) throw new Error(`Đọc danh sách tài nguyên thất bại: ${error.message}`);
  return data ?? [];
}
