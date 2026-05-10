import React from 'react';
import { T } from '../styles/tokens';
import { estimateSize, FORMATS } from '@yoink/shared';
import type { Stage } from '@yoink/shared';
import Icon from './Icon';
import Waveform from './Waveform';

interface ConvertBarProps {
  stage: Stage;
  fmt: string;
  quality: string;
  progress: number;
  durationSecs: number;
  outputPath: string | null;
  onConvert: () => void;
  onCancel: () => void;
  onReveal: () => void;
  onReset: () => void;
  isDownload?: boolean;
}

export default function ConvertBar({
  stage, fmt, quality, progress, durationSecs,
  outputPath, onConvert, onCancel, onReveal, onReset, isDownload,
}: ConvertBarProps) {
  const format = FORMATS.find((f) => f.id === fmt) ?? FORMATS[0];
  const sizeMB = estimateSize(quality, durationSecs);
  const eta = progress > 0 && progress < 100 ? Math.max(1, Math.ceil((100 - progress) / 4)) : 0;

  const verb = isDownload ? 'Download' : 'Convert';

  const title =
    stage === 'converting' ? `${isDownload ? 'Downloading' : 'Converting'} · ${Math.floor(progress)}%` :
    stage === 'done'       ? `${isDownload ? 'Downloaded' : 'Saved'} to Downloads` :
    `${verb} to ${format.label} · ${quality}`;

  const sub =
    stage === 'converting' ? `${((progress / 100) * sizeMB).toFixed(1)} / ${sizeMB} MB · ETA ${eta}s` :
    stage === 'done'       ? `${sizeMB} MB · ${outputPath ? outputPath.split(/[\\/]/).pop() : ''}` :
    `≈ ${sizeMB} MB · ${durationSecs > 0 ? Math.floor(durationSecs / 60) + 'm ' + (durationSecs % 60) + 's' : '—'} clip`;

  return (
    <div style={{
      borderRadius: T.r14, background: T.panelEl, border: `1px solid ${T.borderStrong}`,
      padding: 14, display: 'flex', alignItems: 'center', gap: 14,
      position: 'relative', overflow: 'hidden',
    }}>
      {stage === 'converting' && (
        <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
          <Waveform bars={120} height={70} color={T.accent} />
        </div>
      )}

      {/* Format glyph + info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, position: 'relative', zIndex: 1 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 12,
          background: T.accentBg, color: T.accent,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <Icon
            name={format.kind === 'audio' ? 'audio' : format.kind === 'image' ? 'image' : 'video'}
            size={22} stroke={T.accent} strokeWidth={1.7}
          />
        </div>
        <div>
          <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>{sub}</div>
        </div>
      </div>

      {/* Progress track */}
      {stage === 'converting' && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 3,
          background: 'rgba(255,255,255,0.04)',
        }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: T.accent, boxShadow: `0 0 12px ${T.accent}`,
            transition: 'width 0.3s',
          }} />
        </div>
      )}

      {/* Action button */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {stage === 'done' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onReveal} style={primaryBtn}>
              <Icon name="folder" size={14} stroke="#0e1014" strokeWidth={2.2} />
              Reveal in Explorer
            </button>
            <button onClick={onReset} style={ghostBtn}>New</button>
          </div>
        ) : stage === 'converting' ? (
          <button onClick={onCancel} style={ghostBtn}>
            <Icon name="x" size={14} stroke={T.text} />
            Cancel
          </button>
        ) : (
          <button onClick={onConvert} disabled={stage !== 'ready'} style={{
            ...primaryBtn,
            opacity: stage === 'ready' ? 1 : 0.4,
            cursor: stage === 'ready' ? 'pointer' : 'not-allowed',
          }}>
            {verb}
            <Icon name={isDownload ? 'download' : 'arrowR'} size={14} stroke="#0e1014" strokeWidth={2.2} />
          </button>
        )}
      </div>
    </div>
  );
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 22px', borderRadius: 10, border: 'none',
  background: '#c8ff3a', color: '#0e1014', fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13, fontWeight: 700, letterSpacing: 0.2, cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(200,255,58,0.3)',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 18px', borderRadius: 10,
  background: 'rgba(255,255,255,0.05)', color: '#e7e9ee',
  border: '1px solid rgba(255,255,255,0.10)', fontFamily: "'Space Grotesk', sans-serif",
  fontSize: 13, cursor: 'pointer',
};
