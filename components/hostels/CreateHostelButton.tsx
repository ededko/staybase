"use client";

import { useState } from "react";
import CreateHostelModal from "./CreateHostelModal";

export default function CreateHostelButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
      >
        + Додати хостел
      </button>

      <CreateHostelModal
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}