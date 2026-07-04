"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureUserRecords } from "@/lib/supabase/auth-helpers";

export interface SignInResult {
  error?: string;
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("email not confirmed")) {
    return "Email не подтверждён. В Supabase создайте пользователя с «Auto Confirm user» или подтвердите email.";
  }

  if (lower.includes("invalid login credentials")) {
    return "Неверный логин или пароль. Проверьте пользователя в Supabase: email lserlach@gmail.com, password HealthTracker_Lserlach_2026";
  }

  if (lower.includes("signup is disabled")) {
    return "Регистрация отключена. Supabase: Authentication → Providers → Email → включите Email provider.";
  }

  return message;
}

async function finalizeLogin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  login: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureUserRecords(supabase, user.id, user.email ?? "", login);
    await supabase.from("profiles").update({ login }).eq("id", user.id);
  }

  redirect("/");
}

export async function signInWithLogin(login: string): Promise<SignInResult> {
  const normalizedLogin = login.trim().toLowerCase();
  const allowedLogin = process.env.ALLOWED_LOGIN?.trim().toLowerCase();
  const email = process.env.ALLOWED_EMAIL?.trim().toLowerCase();
  const password = process.env.AUTH_PASSWORD;

  if (!normalizedLogin) {
    return { error: "Введите логин." };
  }

  if (!allowedLogin || !email || !password) {
    return { error: "Вход не настроен. Проверьте .env.local." };
  }

  if (normalizedLogin !== allowedLogin) {
    return { error: "Неверный логин." };
  }

  const supabase = await createClient();

  const { data: loginExists, error: rpcError } = await supabase.rpc("verify_login", {
    p_login: normalizedLogin,
  });

  if (rpcError) {
    const rpcMessage = rpcError.message.toLowerCase();
    if (
      !rpcMessage.includes("does not exist") &&
      !rpcMessage.includes("could not find") &&
      !rpcMessage.includes("schema cache")
    ) {
      return { error: `Ошибка проверки логина: ${rpcError.message}` };
    }
  } else if (loginExists !== true) {
    // Login not in DB yet — still allow if env login matches (first sign-in).
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!signInError) {
    await finalizeLogin(supabase, normalizedLogin);
    return {};
  }

  const signInMessage = signInError.message.toLowerCase();

  if (
    signInMessage.includes("invalid login credentials") ||
    signInMessage.includes("user not found")
  ) {
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { login: normalizedLogin },
      },
    });

    if (signUpError && !signUpError.message.toLowerCase().includes("already")) {
      return { error: mapAuthError(signUpError.message) };
    }

    const { error: retryError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!retryError) {
      await finalizeLogin(supabase, normalizedLogin);
    }

    if (retryError) {
      return { error: mapAuthError(retryError.message) };
    }
  }

  return { error: mapAuthError(signInError.message) };
}
