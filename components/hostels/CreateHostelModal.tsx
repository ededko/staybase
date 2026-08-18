"use client";

import { useActionState, useEffect } from "react";
import { createHostel } from "@/app/actions";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CreateHostelModal({
  open,
  onClose,
}: Props) {
  const [state, formAction, pending] = useActionState(
    createHostel,
    null
  );

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold">
          Новий хостел
        </h2>

        <form action={formAction} className="mt-6">
          <div className="space-y-4">
            <input
              name="name"
              placeholder="Назва"
              className="w-full rounded-xl border p-3"
              required
            />

            <input
              name="address"
              placeholder="Адреса"
              className="w-full rounded-xl border p-3"
            />
            <input name="city" placeholder="Місто" className="w-full rounded-xl border p-3" />
          </div>

          {state?.error && (
            <p className="mt-4 text-sm text-red-600">
              {state.error}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border px-4 py-2"
            >
              Скасувати
            </button>

            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
            >
              {pending ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
