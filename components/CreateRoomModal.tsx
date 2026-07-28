"use client";

import { useActionState, useEffect } from "react";
import { createRoom } from "@/app/actions/create-room";

type Props = {
  hostelId: number;
  open: boolean;
  onClose: () => void;
};

export default function CreateRoomModal({
  hostelId,
  open,
  onClose,
}: Props) {
  const [state, formAction, pending] = useActionState(createRoom, null);

  useEffect(() => {
    if (state?.success) {
      onClose();
    }
  }, [state, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-2xl bg-white p-6">
        <h2 className="text-2xl font-bold">
          Нова кімната
        </h2>

        <form action={formAction} className="mt-6 space-y-4">
          <input
            type="hidden"
            name="hostelId"
            value={hostelId}
          />

          <input
            name="name"
            placeholder="Назва кімнати"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="floor"
            type="number"
            placeholder="Поверх"
            className="w-full rounded-lg border p-3"
            required
          />

          <input
            name="bedsCount"
            type="number"
            placeholder="Кількість ліжок"
            className="w-full rounded-lg border p-3"
            required
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2"
            >
              Скасувати
            </button>

            <button
              disabled={pending}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white"
            >
              {pending ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}