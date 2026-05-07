import { NextResponse } from "next/server";
import { signupSchema } from "@/lib/validation";
import {
  createUserSupabaseClient,
  hasServiceRole,
  supabaseAnon,
  supabaseAdmin,
} from "@/lib/supabase";
import { setSessionCookies } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const payload = signupSchema.parse(await req.json());

    const { data, error } = await supabaseAnon.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { display_name: payload.displayName },
      },
    });

    if (error || !data.user) {
      const msg = error?.message ?? "Unable to create account.";
      if (msg.toLowerCase().includes("already")) {
        return NextResponse.json({ error: "Email is already registered." }, { status: 400 });
      }
      if (msg.toLowerCase().includes("signup")) {
        return NextResponse.json(
          { error: "Signup is currently disabled in Supabase Auth settings." },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { error: msg },
        { status: 400 },
      );
    }

    if (hasServiceRole && supabaseAdmin) {
      await supabaseAdmin.from("users").upsert({
        id: data.user.id,
        email: payload.email,
        display_name: payload.displayName,
      });
    }

    if (data.session) {
      await setSessionCookies(data.session.access_token, data.session.refresh_token, true);

      const userClient = createUserSupabaseClient(data.session.access_token);
      await userClient.from("users").upsert({
        id: data.user.id,
        email: payload.email,
        display_name: payload.displayName,
      });
    }

    if (hasServiceRole && supabaseAdmin) {
      await supabaseAdmin.from("auth_activity_log").insert({
        user_id: data.user.id,
        email: payload.email,
        event_type: "AUTH_SIGNUP",
        details: "Signup completed",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Signup route error:", err);
    return NextResponse.json(
      { error: "Unable to create account. Please verify your inputs and Auth settings." },
      { status: 400 },
    );
  }
}
