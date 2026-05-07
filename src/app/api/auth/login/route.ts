import { NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation";
import { hasServiceRole, supabaseAnon, supabaseAdmin } from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 5;
const INVALID = "Invalid credentials";

export async function POST(req: Request) {
  try {
    const payload = loginSchema.parse(await req.json());
    const adminClient = hasServiceRole ? supabaseAdmin : null;
    let guard: { failed_attempts?: number; locked_until?: string | null } | null = null;
    if (adminClient) {
      const result = await adminClient
        .from("login_security")
        .select("*")
        .eq("identifier", payload.email)
        .maybeSingle();
      guard = result.data;
    }

    if (guard?.locked_until && new Date(guard.locked_until) > new Date()) {
      if (adminClient) {
        await adminClient.from("auth_activity_log").insert({
          email: payload.email,
          event_type: "AUTH_LOCKED",
          details: "Attempted login during lockout",
        });
      }
      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error || !data.user || !data.session) {
      const attempts = (guard?.failed_attempts ?? 0) + 1;
      const lockedUntil =
        attempts >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000).toISOString()
          : null;

      if (adminClient) {
        await adminClient.from("login_security").upsert({
          identifier: payload.email,
          failed_attempts: attempts >= MAX_FAILED_ATTEMPTS ? 0 : attempts,
          locked_until: lockedUntil,
        });

        await adminClient.from("auth_activity_log").insert({
          email: payload.email,
          event_type:
            attempts >= MAX_FAILED_ATTEMPTS ? "AUTH_LOCKED" : "AUTH_LOGIN_FAILED",
          details:
            attempts >= MAX_FAILED_ATTEMPTS
              ? "Account locked after failed attempts"
              : `Failed login attempt ${attempts}/${MAX_FAILED_ATTEMPTS}`,
        });
      }

      return NextResponse.json({ error: INVALID }, { status: 401 });
    }

    await setSessionCookies(
      data.session.access_token,
      data.session.refresh_token,
      payload.rememberMe,
    );
    if (adminClient) {
      await adminClient.from("login_security").upsert({
        identifier: payload.email,
        failed_attempts: 0,
        locked_until: null,
      });
      await adminClient.from("auth_activity_log").insert({
        user_id: data.user.id,
        email: payload.email,
        event_type: "AUTH_LOGIN_SUCCESS",
        details: "Login successful",
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: INVALID }, { status: 401 });
  }
}
