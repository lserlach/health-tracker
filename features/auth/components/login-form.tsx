"use client";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import { UserCircle } from "@phosphor-icons/react";
import { signInWithLogin } from "@/features/auth/actions/sign-in";
import { isLoginConfigured } from "@/features/auth/lib/auth-config";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const errorMessages: Record<string, string> = {
  auth: "Не удалось войти. Попробуйте ещё раз.",
  unauthorized: "Нет доступа к приложению.",
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [login, setLogin] = useState("lserlach");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = searchParams.get("error");
  const initialError = urlError ? (errorMessages[urlError] ?? null) : null;

  const configError = useMemo(() => {
    if (!isLoginConfigured()) {
      return "Вход не настроен. Проверьте .env.local и перезапустите сервер.";
    }
    return null;
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithLogin(login);
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      if (isRedirectError(err)) {
        throw err;
      }
      setError("Не удалось войти. Попробуйте ещё раз.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <PageContainer className="justify-center pb-24">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UserCircle size={28} weight="regular" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Lurea</h1>
        <p className="mt-2 text-sm text-muted-foreground">Вход по логину</p>
      </div>

      <Card>
        {configError ? (
          <p className="text-sm text-danger">{configError}</p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Логин"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="логин"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              disabled={isLoading}
            />

            {(error ?? initialError) ? (
              <p className="text-sm text-danger">{error ?? initialError}</p>
            ) : null}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || Boolean(configError)}
            >
              {isLoading ? "Входим..." : "Войти"}
            </Button>
          </form>
        )}
      </Card>
    </PageContainer>
  );
}
