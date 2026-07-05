export interface AuthUserConfig {
  login: string;
  email: string;
  password: string;
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAuthUsers(): AuthUserConfig[] {
  const raw = process.env.AUTH_USERS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AuthUserConfig[];
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return [];
      }

      return parsed.map((user) => ({
        login: normalizeLogin(user.login),
        email: normalizeEmail(user.email),
        password: user.password,
      }));
    } catch {
      return [];
    }
  }

  const login = process.env.ALLOWED_LOGIN?.trim();
  const email = process.env.ALLOWED_EMAIL?.trim();
  const password = process.env.AUTH_PASSWORD;

  if (!login || !email || !password) {
    return [];
  }

  return [
    {
      login: normalizeLogin(login),
      email: normalizeEmail(email),
      password,
    },
  ];
}

export function findAuthUserByLogin(login: string): AuthUserConfig | undefined {
  const normalizedLogin = normalizeLogin(login);
  return getAuthUsers().find((user) => user.login === normalizedLogin);
}

export function isAllowedAuthEmail(email: string): boolean {
  const users = getAuthUsers();
  if (users.length === 0) {
    return true;
  }

  const normalizedEmail = normalizeEmail(email);
  return users.some((user) => user.email === normalizedEmail);
}

export function isAuthCredentialsConfigured() {
  return getAuthUsers().length > 0;
}
