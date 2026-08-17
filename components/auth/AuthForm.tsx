"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    const result = mode === "register"
      ? await authClient.signUp.email({
          name: String(form.get("name")).trim(),
          email,
          password,
        })
      : await authClient.signIn.email({ email, password });

    setPending(false);

    if (result.error) {
      setError(
        mode === "login"
          ? "Неправильний email або пароль."
          : result.error.message || "Не вдалося створити акаунт."
      );
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      {mode === "register" && (
        <div>
          <label className="mb-1 block text-sm text-slate-600">Ім’я</label>
          <input name="name" required className="w-full rounded-lg border p-3" />
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input name="email" type="email" required className="w-full rounded-lg border p-3" />
      </div>
      <div>
        <label className="mb-1 block text-sm text-slate-600">Пароль</label>
        <input
          name="password"
          type="password"
          minLength={8}
          maxLength={128}
          required
          className="w-full rounded-lg border p-3"
        />
        {mode === "register" && (
          <p className="mt-1 text-xs text-slate-500">Мінімум 8 символів.</p>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        disabled={pending}
        className="w-full rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {pending ? "Зачекайте…" : mode === "login" ? "Увійти" : "Створити акаунт"}
      </button>

      <p className="text-center text-sm text-slate-600">
        {mode === "login" ? "Ще немає акаунта?" : "Уже маєте акаунт?"}{" "}
        <Link
          href={mode === "login" ? "/register" : "/login"}
          className="font-medium text-blue-600 hover:underline"
        >
          {mode === "login" ? "Зареєструватися" : "Увійти"}
        </Link>
      </p>
    </form>
  );
}
