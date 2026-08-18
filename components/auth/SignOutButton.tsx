"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="sign-out rounded-xl px-3 py-2 text-sm font-semibold">
      Вийти
    </button>
  );
}
