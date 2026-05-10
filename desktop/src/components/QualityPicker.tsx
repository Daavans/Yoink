import React from 'react';
import { T } from '../styles/tokens';
import { QUALITIES_VIDEO, QUALITIES_AUDIO, SIZE_RATE, AUDIO_FORMAT_IDS } from '@yoink/shared';

interface QualityPickerProps {
  selected: string;
  format: string;
  onChange: (q: string) => void;
  qualities?: readonly string[];
  label?: string;
  hints?: Record<string, string>;
}

const SIZE_HINTS: Record<string, string> = {
  '360p':     '~12 MB/min',
  '720p':     '~36 MB/min',
  '1080p':    '~74 MB/min',
  '1440p':    '~140 MB/min',
  '4K':       '~310 MB/min',
  '128 kbps': '~3.5 MB/min',
  '192 kbps': '~5 MB/min',
  '256 kbps': '~7 MB/min',
  '320 kbps': '~8 MB/min',
};

export default function QualityPicker({ selected, format, onChange, qualities, label: labelProp, hints }: QualityPickerProps) {
  const isAudio = AUDIO_FORMAT_IDS.has(format);
  const opts = qualities ? [...qualities] : isAudio ? [...QUALITIES_AUDIO] : [...QUALITIES_VIDEO];
  const label = labelProp ?? (isAudio ? 'BITRATE' : 'RESOLUTION');
  const sizeHints = hints ?? SIZE_HINTS;

  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10.5, color: T.faint, letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {opts.map((q) => {
          const active = q === selected;
          return (
            <button key={q} onClick={() => onChange(q)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 9,
              background: active ? T.accentBg : T.panel,
              border: `1px solid ${active ? T.accentBorder : T.border}`,
              color: T.text, cursor: 'pointer', fontFamily: T.font, textAlign: 'left',
              transition: 'border-color 0.12s, background 0.12s',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 14, height: 14, borderRadius: 7,
                  border: `1.5px solid ${active ? T.accent : 'rgba(255,255,255,0.2)'}`,
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {active && <span style={{ width: 6, height: 6, borderRadius: 3, background: T.accent }} />}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{q}</span>
              </span>
              <span style={{ fontSize: 11, color: T.muted, fontFamily: T.mono }}>
                {sizeHints[q] ?? ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
