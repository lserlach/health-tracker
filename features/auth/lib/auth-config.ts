export function isAuthConfigured() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      key &&
      !key.includes("your-anon-key") &&
      !key.includes("PASTE_PUBLISHABLE_KEY_HERE"),
  );
}

export function isLoginConfigured() {
  // Server-only vars (ALLOWED_LOGIN, AUTH_PASSWORD) are checked in the server action.
  return isAuthConfigured();
}
