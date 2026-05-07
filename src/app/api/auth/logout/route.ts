import { NextResponse } from "next/server";
import { clearSessionCookies, getCurrentUser } from "@/lib/auth";
import { hasServiceRole, supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const user = await getCurrentUser();
  if (user?.email && hasServiceRole && supabaseAdmin) {
    await supabaseAdmin.from("auth_activity_log").insert({
      user_id: user.id,
      email: user.email,
      event_type: "AUTH_LOGOUT",
      details: "User logged out",
    });
  }

  await clearSessionCookies();
  return NextResponse.json({ ok: true });
}
