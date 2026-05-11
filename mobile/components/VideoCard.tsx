import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { VideoMeta } from '@yoink/shared';
import { T } from '../styles/tokens';

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoCard({ meta }: { meta: VideoMeta }) {
  return (
    <View style={s.card}>
      {meta.thumbnailUrl ? (
        <Image source={{ uri: meta.thumbnailUrl }} style={s.thumb} resizeMode="cover" />
      ) : (
        <View style={[s.thumb, s.thumbPlaceholder]} />
      )}
      <View style={s.info}>
        <Text style={s.title} numberOfLines={2}>{meta.title}</Text>
        <Text style={s.sub}>{meta.channel}</Text>
        <Text style={s.sub}>{fmtDuration(meta.durationSecs)} · {meta.views}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card:            { flexDirection: 'row', gap: 12, backgroundColor: T.panel, borderRadius: 14, padding: 12, borderWidth: 0.5, borderColor: T.border },
  thumb:           { width: 100, height: 66, borderRadius: 8 },
  thumbPlaceholder:{ backgroundColor: '#1e2228' },
  info:            { flex: 1, justifyContent: 'center', gap: 4 },
  title:           { color: T.text, fontSize: 13, fontWeight: '600', lineHeight: 18 },
  sub:             { color: T.muted, fontSize: 11.5 },
});
