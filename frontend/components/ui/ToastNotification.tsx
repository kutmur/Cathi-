'use client';
import { createContext, useContext, useState, ReactNode } from 'react';

type Level = 'success' | 'error' | 'info';
interface Toast { id: number; level: Level; message: string }
interface Ctx { showToast: (l: Level, m: string) => void }

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (level: Level, message: string) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, level, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="rounded px-4 py-2 text-white shadow text-sm"
            style={{
              background:
                t.level === 'success'
                  ? '#22c55e'
                  : t.level === 'error'
                  ? '#ef4444'
                  : '#0ea5e9',
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}