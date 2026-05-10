import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { T } from '../styles/tokens';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setItems((prev) => [...prev.slice(-4), { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div style={{
        position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8,
        alignItems: 'flex-end', pointerEvents: 'none',
      }}>
        {items.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const color =
    item.type === 'success' ? T.accent :
    item.type === 'error'   ? '#ff5b5b' : T.muted;

  return (
    <div style={{
      pointerEvents: 'all',
      minWidth: 280, maxWidth: 400,
      background: T.panelEl,
      border: `1px solid ${T.borderStrong}`,
      borderLeft: `3px solid ${color}`,
      borderRadius: T.r10,
      padding: '11px 14px',
      display: 'flex', alignItems: 'flex-start', gap: 10,
      boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
      animation: 'toast-slide-in 0.18s ease-out',
    }}>
      {/* dot */}
      <span style={{
        width: 6, height: 6, borderRadius: 3, flexShrink: 0, marginTop: 5,
        background: color, boxShadow: `0 0 8px ${color}`,
        display: 'block',
      }} />

      <span style={{
        flex: 1, fontSize: 12.5, color: T.text, lineHeight: 1.55,
        fontFamily: T.font, wordBreak: 'break-word',
      }}>
        {item.message}
      </span>

      <button
        onClick={() => onDismiss(item.id)}
        style={{
          background: 'none', border: 'none', color: T.faint,
          cursor: 'pointer', fontSize: 15, lineHeight: 1,
          padding: '1px 3px', flexShrink: 0, marginLeft: 4,
        }}
      >×</button>
    </div>
  );
}
