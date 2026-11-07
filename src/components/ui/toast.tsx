"use client";

import React, { createContext, useContext, useState, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import clsx from "clsx";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4000 }: Omit<ToastItem, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: "success", title, message }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ type: "error", title, message }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: "info", title, message }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {toasts.map((t) => {
              let Icon = CheckCircle2;
              let borderClass = "border-emerald-500/40";
              let bgClass = "bg-slate-900/95";
              let iconClass = "text-emerald-400";

              if (t.type === "error") {
                Icon = AlertCircle;
                borderClass = "border-rose-500/40";
                iconClass = "text-rose-400";
              } else if (t.type === "info") {
                Icon = Info;
                borderClass = "border-primary/40";
                iconClass = "text-primary";
              }

              return (
                <div
                  key={t.id}
                  className={clsx(
                    "pointer-events-auto p-3.5 rounded-xl border shadow-xl backdrop-blur-md flex items-start gap-3 transition-all transform translate-y-0",
                    borderClass,
                    bgClass
                  )}
                >
                  <Icon className={clsx("w-4 h-4 shrink-0 mt-0.5", iconClass)} />
                  <div className="flex-1 min-w-0">
                    {t.title && <div className="text-xs font-semibold text-white mb-0.5">{t.title}</div>}
                    <div className="text-xs text-slate-300 leading-relaxed">{t.message}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(t.id)}
                    className="p-1 rounded text-slate-500 hover:text-white transition cursor-pointer shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
