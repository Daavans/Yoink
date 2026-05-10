import React from 'react';
import { T } from '../styles/tokens';
import { FORMATS } from '@yoink/shared';
import type { HistoryEntry } from '@yoink/shared';
import Icon from '../components/Icon';

interface HistoryViewProps {
  history: HistoryEntry[];
  onClear: () => void;
}

export default function HistoryView({ history, onClear }: HistoryViewProps) {
  return (
    <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0, overflowY: 'auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>History</div>
          <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
            {history.length} conversion{history.length !== 1 ? 's' : ''} · click a row to reveal in Explorer
          </div>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} style={{
            padding: '8px 16px', borderRadius: 8,
            background: 'rgba(255,91,91,0.1)', border: '1px solid rgba(255,91,91,0.25)',
            color: '#ff5b5b', fontSize: 12.5, cursor: 'pointer', fontFamily: T.font,
          }}>
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, color: T.faint,
        }}>
          <Icon name="history" size={40} stroke={T.faint} strokeWidth={1.2} />
          <div style={{ fontSize: 14 }}>No conversions yet</div>
          <div style={{ fontSize: 12, color: T.faint }}>Completed downloads will appear here</div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4,
          background: T.panel, borderRadius: T.r14,
          border: `1px solid ${T.border}`, overflow: 'hidden',
        }}>
          {history.map((entry, i) => (
            <HistoryRow key={entry.id} entry={entry} divider={i < history.length - 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryRow({ entry, divider }: { entry: HistoryEntry; divider: boolean }) {
  const fmtId = entry.format.toLowerCase();
  const fmt = FORMATS.find((f) => f.id === fmtId) ?? FORMATS[0];
  const when = relativeTime(entry.completedAt);
  const isAudio = fmt.kind === 'audio';
  const dotColor = isAudio ? T.accent : fmt.kind === 'image' ? '#ffae5b' : '#7ad6ff';

  return (
    <div
      onClick={() => window.yoink.file.reveal(entry.outputPath)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px',
        cursor: 'pointer', transition: 'background 0.1s',
        borderBottom: divider ? `1px solid ${T.border}` : 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Format badge */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: `rgba(${isAudio ? '200,255,58' : fmt.kind === 'image' ? '255,174,91' : '122,214,255'},0.08)`,
        display: 'grid', placeItems: 'center',
      }}>
        <Icon
          name={isAudio ? 'audio' : fmt.kind === 'image' ? 'image' : 'video'}
          size={20} stroke={dotColor} strokeWidth={1.6}
        />
      </div>

      {/* Title + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, color: T.text, fontWeight: 500,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{entry.title}</div>
        <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginTop: 3 }}>
          {entry.format} · {entry.quality}{entry.sizeMB ? ` · ${entry.sizeMB} MB` : ''}
        </div>
      </div>

      {/* Date + check */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: T.faint, fontFamily: T.mono }}>{when}</span>
        <div style={{
          width: 22, height: 22, borderRadius: 11,
          background: T.accentBg, display: 'grid', placeItems: 'center',
        }}>
          <Icon name="check" size={12} stroke={T.accent} strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}
