import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { T } from '../styles/tokens';

type ToastType = 'success' | 'error' | 'info';
interface ToastItem { id: number; message: string; type: ToastType; }

const ToastCtx = createContext<{ toast: (msg: string, type?: ToastType) => void }>({ toast: () => {} });

export function useToast() { return useContext(ToastCtx); }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <View style={s.container} pointerEvents="none">
        {toasts.map((t) => (
          <View key={t.id} style={[s.toast, t.type === 'error' && s.error, t.type === 'success' && s.success]}>
            <Text style={s.text}>{t.message}</Text>
          </View>
        ))}
      </View>
    </ToastCtx.Provider>
  );
}

const s = StyleSheet.create({
  container: { position: 'absolute', bottom: 80, left: 16, right: 16, gap: 8 },
  toast:   { backgroundColor: '#1e2228', borderRadius: 12, padding: 14, borderLeftWidth: 3, borderLeftColor: T.muted },
  success: { borderLeftColor: T.accent },
  error:   { borderLeftColor: T.error },
  text:    { color: T.text, fontSize: 13 },
});
