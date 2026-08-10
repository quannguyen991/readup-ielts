import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { hasSupabaseConfig, publicEnv } from './env';
import type { Database } from '@/types/database';

let client: SupabaseClient<Database> | null = null;

/**
 * Supabase client phía người dùng (anon key + RLS).
 * Trên native dùng AsyncStorage để lưu session; trên web dùng localStorage mặc định.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!hasSupabaseConfig()) {
    throw new Error(
      'Chưa cấu hình Supabase. Điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY trong .env.local.',
    );
  }

  if (!client) {
    client = createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === 'web',
      },
    });
  }

  return client;
}
