import { useQuery } from '@tanstack/react-query';

import { hasSupabaseConfig } from '@/lib/env';
import { getSupabase } from '@/lib/supabase';

export type AssetMap = Record<string, string>;

/**
 * Đọc bảng generated_assets một lần rồi cache trong bộ nhớ (24 giờ).
 * Ảnh đã nằm sẵn trong Supabase Storage nên client không bao giờ gọi OpenAI.
 */
export function useAssetMap() {
  return useQuery<AssetMap>({
    queryKey: ['generated-assets'],
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled: hasSupabaseConfig(),
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('generated_assets')
        .select('cache_key, public_url');

      if (error) throw new Error(error.message);

      const map: AssetMap = {};
      for (const row of data ?? []) {
        if (row.public_url) map[row.cache_key] = row.public_url;
      }
      return map;
    },
  });
}

/** URL của một tài nguyên theo cache key, hoặc undefined nếu chưa sinh. */
export function useAssetUrl(key: string): string | undefined {
  const { data } = useAssetMap();
  return data?.[key];
}

export const assetKeys = {
  navIcon: (name: string) => `nav/${name}`,
  questionIcon: (type: string) => `question-type/${type}`,
  topicThumbnail: (topic: string) => `topic/${topic}`,
  articleThumbnail: (articleId: string) => `article/${articleId}`,
  illustration: (name: string) => `illustration/${name}`,
} as const;
