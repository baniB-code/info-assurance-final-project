import { cookies } from "next/headers";
import { supabaseAnon } from "./supabase";

const ACCESS_COOKIE = "sn-access-token";
const REFRESH_COOKIE = "sn-refresh-token";
const SEVEN_DAYS_SECONDS = 60 * 60 * 24 * 7;

export const setSessionCookies = async (
  accessToken: string,
  refreshToken: string,
  rememberMe = false,
) => {
  const store = await cookies();
  const secure = process.env.NODE_ENV === "production";

  store.set(ACCESS_COOKIE, accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: rememberMe ? SEVEN_DAYS_SECONDS : undefined,
    path: "/",
  });
  store.set(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: rememberMe ? SEVEN_DAYS_SECONDS : undefined,
    path: "/",
  });
};

export const clearSessionCookies = async () => {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
};

export const getCurrentUser = async () => {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const { data } = await supabaseAnon.auth.getUser(token);
  return data.user ?? null;
};

export const getAccessToken = async () => {
  const store = await cookies();
  return store.get(ACCESS_COOKIE)?.value ?? null;
};
