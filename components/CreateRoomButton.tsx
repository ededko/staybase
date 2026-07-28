"use client";

import { useState } from "react";
import CreateRoomModal from "./CreateRoomModal";

type Props = {
  hostelId: number;
};

export default function CreateRoomButton({ hostelId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
      >
        + Додати кімнату
      </button>

      <CreateRoomModal
        hostelId={hostelId}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}