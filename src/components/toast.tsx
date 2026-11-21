"use client";

import { useEffect, useState } from "react";

interface ToastPayload {
  message: string;
}

export const TOAST_EVENT = "iptv:toast";

export function showToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT, { detail: { message } }));
}

/** Toast accessibile: vive sotto il contenuto, annunciato via aria-live. */
export function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.message) return;
      setMessage(detail.message);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setMessage(null), 2600);
    };

    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
    >
      <div className="animate-slide-in pointer-events-auto flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-fg shadow-card">
        <span aria-hidden="true" className="text-success">
          ✓
        </span>
        {message}
      </div>
    </div>
  );
}
