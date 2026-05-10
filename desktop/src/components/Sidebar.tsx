import React, { useEffect, useState } from 'react';
import { T } from '../styles/tokens';
import Icon from './Icon';

interface SidebarProps {
  activeView: string;
  onViewChange: (v: string) => void;
  onPresetSelect: (format: string, quality: string) => void;
}

const NAV_ITEMS = [
  { id: 'new',     icon: 'youtube'  as const, label: 'YouTube' },
  { id: 'history', icon: 'history'  as const, label: 'History' },
  { id: 'convert', icon: 'scissors' as const, label: 'Convert file' },
];

const PRESETS = [
  { label: 'Music · 320',      color: T.accent,   format: 'mp3', quality: '320 kbps' },
  { label: 'Pocket · 720p',    color: '#7ad6ff',  format: 'mp4', quality: '720p' },
  { label: 'Archive · MOV',    color: '#ffae5b',  format: 'mov', quality: '1080p' },
];

export default function Sidebar({ activeView, onViewChange, onPresetSelect }: SidebarProps) {
  const [storage, setStorage] = useState({ usedGB: 0, totalGB: 1 });

  useEffect(() => {
    window.yoink?.storage?.get().then(setStorage).catch(() => {});
  }, []);

  const usedPct = storage.totalGB > 0 ? Math.round((storage.usedGB / storage.totalGB) * 100) : 0;

  return (
    <div style={{
      width: 200, flexShrink: 0, borderRight: `1px solid ${T.border}`,
      padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: 4,
      background: T.sidebar,
    }}>
      <div style={{ fontSize: 10.5, color: T.faint, letterSpacing: 1.5, padding: '4px 10px 10px', fontWeight: 600 }}>
        WORKSPACE
      </div>

      {NAV_ITEMS.map((it) => {
        const active = activeView === it.id;
        return (
          <button key={it.id} onClick={() => onViewChange(it.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, fontSize: 13,
            color: active ? T.text : T.muted,
            background: active ? T.accentBg : 'transparent',
            boxShadow: active ? `inset 0 0 0 1px rgba(200,255,58,0.15)` : 'none',
            border: 'none', textAlign: 'left', cursor: 'pointer', width: '100%',
            transition: 'background 0.1s',
          }}>
            <Icon name={it.icon} size={15} stroke={active ? T.accent : T.muted} />
            <span style={{ flex: 1 }}>{it.label}</span>
          </button>
        );
      })}

      <div style={{ fontSize: 10.5, color: T.faint, letterSpacing: 1.5, padding: '20px 10px 10px', fontWeight: 600 }}>
        PRESETS
      </div>

      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => {
            onPresetSelect(p.format, p.quality);
            onViewChange('new');
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, fontSize: 12.5, color: T.muted,
            background: 'transparent', border: 'none', textAlign: 'left',
            cursor: 'pointer', width: '100%', transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ width: 6, height: 6, borderRadius: 3, background: p.color, flexShrink: 0 }} />
          {p.label}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* Storage card */}
      <div style={{
        padding: 12, borderRadius: 10,
        background: T.panel, border: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: T.muted }}>Storage</span>
          <span style={{ fontFamily: T.mono, fontSize: 10.5, color: T.text }}>{usedPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${usedPct}%`, background: T.accent }} />
        </div>
        <div style={{ fontSize: 10.5, color: T.faint, marginTop: 8, fontFamily: T.mono }}>
          {storage.usedGB} / {storage.totalGB} GB
        </div>
      </div>
    </div>
  );
}
