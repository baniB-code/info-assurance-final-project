import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

const fallbackUrl = "http://127.0.0.1:54321";
const fallbackKey = "dev-placeholder-key";
const resolvedUrl = env.supabaseUrl || fallbackUrl;
const resolvedAnonKey = env.supabaseAnonKey || fallbackKey;

export const supabaseAnon = createClient(
  resolvedUrl,
  resolvedAnonKey,
  {
    auth: { autoRefreshToken: false, persistSession: false },
  },
);

export const hasServiceRole = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);

export const supabaseAdmin = hasServiceRole
  ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export const createUserSupabaseClient = (accessToken: string) =>
  createClient(resolvedUrl, resolvedAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
