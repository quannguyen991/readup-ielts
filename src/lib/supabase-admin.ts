import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { serverEnv } from './env';
import type { Database } from '@/types/database';

/**
 * SERVER-ONLY. Client dùng service role key — bỏ qua RLS.
 * Chỉ import từ API route, Edge Function hoặc script trong scripts/.
 */

let admin: SupabaseClient<Database> | null = null;

export function getSupabaseAdmin(): SupabaseClient<Database> {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    throw new Error('supabase-admin chỉ được dùng ở server, không import vào code client.');
  }

  if (!admin) {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
    if (!url) {
      throw new Error('Thiếu EXPO_PUBLIC_SUPABASE_URL (hoặc SUPABASE_URL) trong .env.local.');
    }

    admin = createClient<Database>(url, serverEnv('SUPABASE_SERVICE_KEY'), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return admin;
}

/** Bucket công khai chứa icon / thumbnail / illustration đã sinh. */
export const ASSET_BUCKET = 'assets';
