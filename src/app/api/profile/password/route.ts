import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";
import { createUserSupabaseClient, supabaseAnon } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  try {
    const payload = changePasswordSchema.parse(await req.json());

    const { error: loginError } = await supabaseAnon.auth.signInWithPassword({
      email: user.email,
      password: payload.currentPassword,
    });

    if (loginError) {
      return NextResponse.json({ error: "Invalid current password" }, { status: 400 });
    }

    const { error } = await supabaseUser.auth.updateUser({
      password: payload.newPassword,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Could not change password" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid password format" }, { status: 400 });
  }
}
