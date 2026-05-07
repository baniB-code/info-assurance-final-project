import { NextResponse } from "next/server";
import { getAccessToken, getCurrentUser } from "@/lib/auth";
import { profileSchema } from "@/lib/validation";
import { createUserSupabaseClient } from "@/lib/supabase";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const token = await getAccessToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabaseUser = createUserSupabaseClient(token);

  try {
    const payload = profileSchema.parse(await req.json());
    const { error: profileError } = await supabaseUser
      .from("users")
      .upsert({
        id: user.id,
        email: user.email,
        display_name: payload.displayName,
        bio: payload.bio,
        avatar_url: payload.avatarUrl,
      });

    if (profileError) {
      return NextResponse.json({ error: "Could not update profile record." }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid profile data" }, { status: 400 });
  }
}
