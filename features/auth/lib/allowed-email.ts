export function getAllowedEmail() {
  return process.env.NEXT_PUBLIC_ALLOWED_EMAIL?.trim().toLowerCase() ?? "";
}

export function isAllowedEmail(email: string) {
  const allowed = getAllowedEmail();
  if (!allowed) return true;
  return email.trim().toLowerCase() === allowed;
}

export function isAuthConfigured() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      key &&
      !key.includes("your-anon-key") &&
      !key.includes("PASTE_PUBLISHABLE_KEY_HERE"),
  );
}
