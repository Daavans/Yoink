import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { T } from '../styles/tokens';

interface Props {
  qualities: readonly string[];
  selected: string;
  onChange: (q: string) => void;
}

export default function QualityPicker({ qualities, selected, onChange }: Props) {
  return (
    <View style={s.grid}>
      {qualities.map((q) => {
        const active = q === selected;
        return (
          <TouchableOpacity key={q} onPress={() => onChange(q)} style={[s.btn, active && s.active]}>
            <Text style={[s.label, { color: active ? T.accent : T.text }]}>{q}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  grid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  btn:    { flex: 1, minWidth: '30%', paddingVertical: 12, borderRadius: 11, borderWidth: 0.5, borderColor: T.border, backgroundColor: T.panel, alignItems: 'center' },
  active: { borderColor: 'rgba(200,255,58,0.4)', backgroundColor: T.accentBg },
  label:  { fontSize: 13, fontWeight: '600' },
});
