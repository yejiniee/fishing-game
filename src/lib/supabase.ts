import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// 환경변수(.env)가 없으면 랭킹 기능만 비활성화하고, 게임 자체는 정상 동작하게 한다.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isRankingEnabled = Boolean(url && anonKey);

// 설정이 없을 때는 null. 사용하는 쪽에서 isRankingEnabled 로 분기한다.
export const supabase: SupabaseClient | null = isRankingEnabled
  ? createClient(url as string, anonKey as string)
  : null;
