import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase 客户端（浏览器直连 · RLS 行级安全 · 匿名认证）
// 若未配置环境变量则返回 null，应用自动降级为纯 localStorage 模式
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseConfigured = supabase !== null;

// 匿名登录（无密码 · 自动创建临时用户 · 数据按 user_id 隔离）
export async function ensureAnonymousSession(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: signUpData, error } = await supabase.auth.signInAnonymously();
  if (error || !signUpData.user) return null;
  return signUpData.user.id;
}
