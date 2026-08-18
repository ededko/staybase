"use client";

import { useState } from "react";
import CreateHostelModal from "./CreateHostelModal";

export default function CreateHostelButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="primary-action rounded-xl px-5 py-3 font-semibold text-white"
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
