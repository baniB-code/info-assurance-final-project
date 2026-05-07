const getEnv = (name: string, fallback = "") => process.env[name] ?? fallback;

export const env = {
  supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  webgoatLessonUrl: getEnv(
    "NEXT_PUBLIC_WEBGOAT_LESSON_URL",
    "https://owasp.org/www-project-webgoat/",
  ),
  appName: getEnv("NEXT_PUBLIC_APP_NAME", "Sentinel Notes"),
};

export const assertServerEnv = () => {
  if (!env.supabaseUrl || !env.supabaseAnonKey || !env.supabaseServiceRoleKey) {
    throw new Error("Missing required Supabase environment variables.");
  }
};
