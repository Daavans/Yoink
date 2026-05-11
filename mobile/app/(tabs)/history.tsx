import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  FlatList, Alert,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { T } from '../../styles/tokens';
import { useHistory } from '../../hooks/useHistory';
import type { HistoryEntry } from '@yoink/shared';

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const FORMAT_COLORS: Record<string, string> = {
  mp4: '#4a9eff', webm: '#7b5cf7', mov: '#e05cff', mp3: '#c8ff3a',
  wav: '#ffd700', flac: '#ff9500', m4a: '#00d4aa', gif: '#ff6b6b',
  jpg: '#ff8c42', png: '#4ecdc4', pdf: '#ff5b5b',
};

function EntryRow({ entry, onShare }: { entry: HistoryEntry; onShare: () => void }) {
  const color = FORMAT_COLORS[entry.format] ?? T.muted;
  return (
    <TouchableOpacity style={s.row} onPress={onShare}>
      <View style={[s.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
        <Text style={[s.badgeText, { color }]}>{entry.format.toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle} numberOfLines={1}>{entry.title}</Text>
        <Text style={s.rowSub}>{entry.quality} · {entry.sizeMB} MB · {relativeTime(entry.completedAt)}</Text>
      </View>
      <Text style={{ color: T.faint, fontSize: 18 }}>↑</Text>
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const { history, clear } = useHistory();

  const handleShare = async (entry: HistoryEntry) => {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) await Sharing.shareAsync(entry.outputPath);
    } catch {
      // file may have been deleted
    }
  };

  const handleClear = () => {
    Alert.alert('Clear history', 'Remove all history entries?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clear },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={s.header}>
        <Text style={s.heading}>History</Text>
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={{ color: T.error, fontSize: 13 }}>Clear all</Text>
          </TouchableOpacity>
        )}
      </View>

      {history.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 36 }}>⏱</Text>
          <Text style={{ color: T.muted, marginTop: 12, fontSize: 14 }}>No conversions yet</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 8 }}
          renderItem={({ item }) => <EntryRow entry={item} onShare={() => handleShare(item)} />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 8 },
  heading:   { fontSize: 26, fontWeight: '700', color: T.text },
  empty:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row:       { flexDirection: 'row', alignItems: 'center', backgroundColor: T.panel, borderRadius: 14, padding: 14, borderWidth: 0.5, borderColor: T.border, gap: 12 },
  badge:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 0.5 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  rowTitle:  { color: T.text, fontSize: 13, fontWeight: '600' },
  rowSub:    { color: T.muted, fontSize: 11, marginTop: 2 },
});
