import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import type { Format } from '@yoink/shared';
import { T } from '../styles/tokens';

interface Props {
  formats: Format[];
  selected: string;
  onChange: (id: string) => void;
}

export default function FormatPicker({ formats, selected, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {formats.map((f) => {
        const active = f.id === selected;
        return (
          <TouchableOpacity key={f.id} onPress={() => onChange(f.id)} style={[s.chip, active && s.active]}>
            <Text style={[s.label, { color: active ? T.accent : T.text }]}>{f.label}</Text>
            <Text style={s.sub}>{f.sub.split('·')[0].trim()}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  chip:   { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 0.5, borderColor: T.border, backgroundColor: T.panel, minWidth: 64, alignItems: 'center' },
  active: { borderColor: 'rgba(200,255,58,0.4)', backgroundColor: T.accentBg },
  label:  { fontSize: 12.5, fontWeight: '600' },
  sub:    { fontSize: 9.5, color: T.muted, marginTop: 2 },
});
