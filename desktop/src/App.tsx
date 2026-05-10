import React, { useEffect, useCallback } from 'react';
import { T } from './styles/tokens';
import { useConverter } from './hooks/useConverter';
import { useHistory } from './hooks/useHistory';
import Titlebar from './components/Titlebar';
import Sidebar from './components/Sidebar';
import LinkInput from './components/LinkInput';
import VideoCard from './components/VideoCard';
import FormatPicker from './components/FormatPicker';
import QualityPicker from './components/QualityPicker';
import ConvertBar from './components/ConvertBar';
import RecentPanel from './components/RecentPanel';
import { ToastProvider, useToast } from './components/Toast';
import Icon from './components/Icon';
import HistoryView from './views/HistoryView';
import ConvertView from './views/ConvertView';

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}

function AppInner() {
  const { state, setUrl, setFormat, setQuality, setTrim, sniff, convert, cancel, reset, reveal } = useConverter();
  const { history, refresh } = useHistory();
  const { toast } = useToast();
  const [activeView, setActiveView] = React.useState('new');

  const prevStage = React.useRef(state.stage);

  useEffect(() => {
    const prev = prevStage.current;
    prevStage.current = state.stage;
    if (state.stage === 'done' && prev === 'converting') {
      refresh();
      toast('Conversion complete — saved to Downloads', 'success');
    }
  }, [state.stage, refresh, toast]);

  useEffect(() => {
    if (state.error) toast(state.error, 'error');
  }, [state.error, toast]);

  const handlePreset = useCallback((format: string, quality: string) => {
    setFormat(format);
    setQuality(quality);
    toast(`Preset applied: ${format.toUpperCase()} · ${quality}`, 'info');
  }, [setFormat, setQuality, toast]);

  const clearHistory = useCallback(async () => {
    await window.yoink.history.clear();
    refresh();
    toast('History cleared', 'info');
  }, [refresh, toast]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100vh', background: T.bg, color: T.text,
      fontFamily: T.font,
    }}>
      <Titlebar />

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          onPresetSelect={handlePreset}
        />

        {/* ── History page ── */}
        {activeView === 'history' && (
          <HistoryView history={history} onClear={clearHistory} />
        )}

        {/* ── File converter page ── */}
        {activeView === 'convert' && (
          <ConvertView />
        )}

        {/* ── YouTube downloader (default) ── */}
        {activeView === 'new' && (
          <>
            <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflowY: 'auto' }}>
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: 'rgba(255,40,40,0.12)', display: 'grid', placeItems: 'center',
                  }}>
                    <Icon name="youtube" size={20} stroke="#ff4040" strokeWidth={1.6} />
                  </div>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Grab from YouTube</div>
                    <div style={{ fontSize: 12.5, color: T.muted, marginTop: 3 }}>
                      Paste a video link and Yoink it in any format.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: T.muted }}>
                  <span style={{ fontFamily: T.mono }}>↵</span>
                  <span>to fetch metadata</span>
                </div>
              </div>

              <LinkInput
                url={state.url}
                stage={state.stage}
                onChange={setUrl}
                onPaste={() => sniff()}
              />

              {(state.stage === 'ready' || state.stage === 'converting' || state.stage === 'done') && state.meta && (
                <VideoCard meta={state.meta} trim={state.trim} onTrimChange={setTrim} />
              )}

              {state.stage !== 'idle' && state.stage !== 'sniffing' && (
                <div style={{ display: 'flex', gap: 14 }}>
                  <FormatPicker selected={state.fmt} onChange={setFormat} />
                  <QualityPicker selected={state.quality} format={state.fmt} onChange={setQuality} />
                </div>
              )}

              <div style={{ flex: 1 }} />

              <ConvertBar
                stage={state.stage}
                fmt={state.fmt}
                quality={state.quality}
                progress={state.progress}
                durationSecs={state.meta?.durationSecs ?? 0}
                outputPath={state.outputPath}
                onConvert={convert}
                onCancel={cancel}
                onReveal={reveal}
                onReset={reset}
                isDownload
              />

              <style>{`
                @keyframes ykspin { to { transform: rotate(360deg); } }
                @keyframes toast-slide-in {
                  from { opacity: 0; transform: translateX(16px); }
                  to   { opacity: 1; transform: translateX(0); }
                }
              `}</style>
            </div>

            <RecentPanel
              stage={state.stage}
              progress={state.progress}
              fmt={state.fmt}
              quality={state.quality}
              history={history}
            />
          </>
        )}
      </div>
    </div>
  );
}
