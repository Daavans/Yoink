import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HistoryEntry } from '@yoink/shared';

const KEY = '@yoink/history';

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      setHistory(raw ? JSON.parse(raw) : []);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const add = useCallback(async (entry: HistoryEntry) => {
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      AsyncStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setHistory([]);
  }, []);

  return { history, add, clear, refresh: load };
}
