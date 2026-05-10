import React from 'react';
import { T } from '../styles/tokens';
import { FORMATS } from '@yoink/shared';
import type { Format } from '@yoink/shared';
import Icon from './Icon';

interface FormatPickerProps {
  selected: string;
  onChange: (id: string) => void;
  formats?: Format[];
}

function FormatGlyph({ format, active }: { format: Format; active: boolean }) {
  const iconName =
    format.kind === 'audio'    ? 'audio' :
    format.kind === 'document' ? 'file'  :
    format.kind === 'image'    ? 'image' : 'video';
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 6,
      background: active ? T.accentBg : 'rgba(255,255,255,0.05)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      <Icon name={iconName as 'audio' | 'file' | 'image' | 'video'} size={12} stroke={active ? T.accent : T.muted} strokeWidth={1.7} />
    </div>
  );
}

export default function FormatPicker({ selected, onChange, formats: customFormats }: FormatPickerProps) {
  const list = customFormats ?? FORMATS;
  const cols = list.length <= 4 ? list.length : 4;
  return (
    <div style={{ flex: 1.4 }}>
      <div style={{ fontSize: 10.5, color: T.faint, letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        FORMAT
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {list.map((f) => {
          const active = f.id === selected;
          return (
            <button key={f.id} onClick={() => onChange(f.id)} style={{
              textAlign: 'left', padding: 10, borderRadius: 10,
              background: active ? T.accentBg : T.panel,
              border: `1px solid ${active ? T.accentBorder : T.border}`,
              color: T.text, cursor: 'pointer', fontFamily: T.font,
              display: 'flex', flexDirection: 'column', gap: 6,
              transition: 'border-color 0.12s, background 0.12s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <FormatGlyph format={f} active={active} />
                {active && <Icon name="check" size={13} stroke={T.accent} strokeWidth={2.2} />}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5 }}>{f.label}</div>
              <div style={{ fontSize: 10.5, color: T.muted, fontFamily: T.mono }}>{f.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
