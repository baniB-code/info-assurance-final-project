import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { createUserSupabaseClient } from "@/lib/supabase";
import { forgotPasswordSchema } from "@/lib/validation";
import { supabaseAnon } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const payload = forgotPasswordSchema.parse(await req.json());
    const origin = new URL(req.url).origin;
    const redirectTo = `${origin}/auth/update-password`;

    await supabaseAnon.auth.resetPasswordForEmail(payload.email, { redirectTo });

    const token = await getAccessToken();
    const user = await getCurrentUser();
    if (token && user) {
      const supabaseUser = createUserSupabaseClient(token);
      await supabaseUser.from("auth_activity_log").insert({
        user_id: user.id,
        email: user.email,
        event_type: "AUTH_PASSWORD_RESET_REQUESTED",
        details: "Password reset requested",
      });
    }

    // Generic response prevents account enumeration.
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: true,
        message:
          "If an account exists for this email, a password reset link has been sent.",
      },
      { status: 200 },
    );
  }
}
