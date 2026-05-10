import React, { useState, useRef, useCallback } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { T } from '../styles/tokens';
import {
  FORMATS, IMAGE_OUTPUT_FORMATS, PDF_OUTPUT_FORMATS,
  AUDIO_FORMAT_IDS, IMAGE_INPUT_EXTS, QUALITIES_IMAGE,
} from '@yoink/shared';
import type { InputFileType } from '@yoink/shared';
import Icon from '../components/Icon';
import FormatPicker from '../components/FormatPicker';
import QualityPicker from '../components/QualityPicker';
import Waveform from '../components/Waveform';
import { useToast } from '../components/Toast';

// Configure pdfjs worker from the installed package
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type Stage = 'idle' | 'probing' | 'ready' | 'converting' | 'done';

interface FileState {
  path: string;
  name: string;
  durationSecs: number;
  sizeMB: number;
  type: InputFileType;
}

function detectType(filename: string): InputFileType {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'pdf';
  if (IMAGE_INPUT_EXTS.has(ext)) return 'image';
  const VIDEO = new Set(['mp4','webm','mov','mkv','avi','wmv','flv','ts','m4v','3gp']);
  const AUDIO = new Set(['mp3','wav','flac','m4a','aac','ogg','opus','wma']);
  if (VIDEO.has(ext)) return 'video';
  if (AUDIO.has(ext)) return 'audio';
  return 'unknown';
}

function formatsFor(type: InputFileType) {
  if (type === 'image') return IMAGE_OUTPUT_FORMATS;
  if (type === 'pdf')   return PDF_OUTPUT_FORMATS;
  return FORMATS;
}

function defaultFmt(type: InputFileType) {
  if (type === 'image') return 'png';
  if (type === 'pdf')   return 'png';
  return 'mp4';
}

function defaultQuality(fmt: string, type: InputFileType) {
  if (type === 'image' || type === 'pdf') return 'high';
  if (AUDIO_FORMAT_IDS.has(fmt)) return '320 kbps';
  return '1080p';
}

const IMAGE_QUALITY_HINTS: Record<string, string> = {
  original: 'no compression',
  high:     'minimal loss',
  medium:   'balanced',
  low:      'smallest size',
};

const PDF_RENDER_HINTS: Record<string, string> = {
  high:   '3× scale · ~300 DPI',
  medium: '2× scale · ~200 DPI',
  low:    '1.5× scale · ~150 DPI',
};

export default function ConvertView() {
  const { toast } = useToast();
  const [stage, setStage] = useState<Stage>('idle');
  const [file, setFile] = useState<FileState | null>(null);
  const [fmt, setFmtRaw] = useState('mp4');
  const [quality, setQuality] = useState('1080p');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [outputPath, setOutputPath] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const unsubRef = useRef<(() => void)[]>([]);

  const setFmt = useCallback((f: string) => {
    setFmtRaw(f);
  }, []);

  const probe = useCallback(async (filePath: string, fileName: string) => {
    setStage('probing');
    const type = detectType(fileName);
    try {
      const info = await window.yoink.convert.probe(filePath);
      setFile({ path: filePath, name: fileName, type, ...info });
      const newFmt = defaultFmt(type);
      setFmtRaw(newFmt);
      setQuality(defaultQuality(newFmt, type));
      setStage('ready');
    } catch {
      toast('Could not read file.', 'error');
      setStage('idle');
    }
  }, [toast]);

  const pickFile = async () => {
    const filePath = await window.yoink.file.pickInput();
    if (filePath) {
      const name = filePath.split(/[\\/]/).pop() ?? filePath;
      await probe(filePath, name);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filePath = (f as any).path as string;
    if (filePath) probe(filePath, f.name);
  }, [probe]);

  // ── PDF → images (renderer-side via pdfjs) ─────────────────────────────────
  const convertPdfToImages = useCallback(async () => {
    if (!file) return;
    setStage('converting');
    setProgress(0);

    try {
      const bytes = await window.yoink.file.readBytes(file.path);
      const pdf = await pdfjs.getDocument({ data: bytes }).promise;
      const total = pdf.numPages;
      const scale = quality === 'high' ? 3.0 : quality === 'medium' ? 2.0 : 1.5;
      const mimeType = fmt === 'jpg' ? 'image/jpeg' : 'image/webp';
      const ext = fmt === 'jpg' ? 'jpg' : fmt;

      const stem = file.name.replace(/\.[^.]+$/, '');
      const baseDir = file.path.replace(/[\\/][^\\/]+$/, '');
      const outDir = `${baseDir}/${stem}_pages`;

      let lastSavedDir = outDir;

      for (let i = 1; i <= total; i++) {
        setProgressLabel(`Page ${i} / ${total}`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext('2d')!, viewport, canvas }).promise;

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, mimeType, 0.92));
        if (!blob) continue;
        const arrayBuf = await blob.arrayBuffer();
        const outPath = `${outDir}/page_${String(i).padStart(3, '0')}.${ext}`;
        await window.yoink.convert.saveBuffer(arrayBuf, outPath);
        lastSavedDir = outDir;
        setProgress(Math.round((i / total) * 100));
      }

      setOutputPath(lastSavedDir);
      setStage('done');
      toast(`Exported ${total} page${total !== 1 ? 's' : ''} to ${stem}_pages/`, 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'PDF conversion failed', 'error');
      setStage('ready');
    }
  }, [file, fmt, quality, toast]);

  // ── Server-side conversion (video/audio/image/pdf-compress) ────────────────
  const convertServerSide = useCallback(async () => {
    if (!file) return;
    setStage('converting');
    setProgress(0);
    setProgressLabel('');

    unsubRef.current.push(
      window.yoink.convert.onProgress((data) => {
        const d = data as { pct: number };
        setProgress(d.pct);
      }),
    );
    unsubRef.current.push(
      window.yoink.convert.onDone((data) => {
        const d = data as { outputPath: string };
        unsubRef.current.forEach((u) => u());
        unsubRef.current = [];
        setProgress(100);
        setOutputPath(d.outputPath);
        setStage('done');
        toast('Conversion complete — saved to Downloads', 'success');
      }),
    );
    unsubRef.current.push(
      window.yoink.convert.onError((msg) => {
        unsubRef.current.forEach((u) => u());
        unsubRef.current = [];
        toast(msg, 'error');
        setStage('ready');
      }),
    );

    try {
      await window.yoink.convert.start({
        inputPath: file.path,
        outputFormat: fmt,
        quality,
        durationSecs: file.durationSecs,
      });
    } catch { /* handled via onError */ }
  }, [file, fmt, quality, toast]);

  const convert = useCallback(() => {
    if (!file) return;
    // PDF→images is renderer-side; everything else goes to main process
    if (file.type === 'pdf' && fmt !== 'pdf') {
      return convertPdfToImages();
    }
    return convertServerSide();
  }, [file, fmt, convertPdfToImages, convertServerSide]);

  const cancel = useCallback(() => {
    window.yoink.convert.cancel();
    unsubRef.current.forEach((u) => u());
    unsubRef.current = [];
    setStage('ready');
    setProgress(0);
    setProgressLabel('');
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setFile(null);
    setProgress(0);
    setProgressLabel('');
    setOutputPath(null);
    setFmtRaw('mp4');
    setQuality('1080p');
  }, []);

  const isConverting = stage === 'converting';
  const isDone = stage === 'done';
  const fileType = file?.type ?? 'unknown';
  const outputFormats = formatsFor(fileType);
  const format = outputFormats.find((f) => f.id === fmt) ?? outputFormats[0];

  const isImageOrPdf = fileType === 'image' || fileType === 'pdf';
  const qualityList: readonly string[] = isImageOrPdf ? QUALITIES_IMAGE : undefined!;
  const qualityLabel = fileType === 'image' ? 'QUALITY' : fileType === 'pdf' && fmt !== 'pdf' ? 'RESOLUTION' : undefined;
  const qualityHints = fileType === 'image' ? IMAGE_QUALITY_HINTS : fileType === 'pdf' ? PDF_RENDER_HINTS : undefined;

  const acceptedTypes = 'MP4, MKV, MP3, WAV, FLAC, JPG, PNG, WEBP, PDF and more';

  return (
    <div style={{ flex: 1, padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, overflowY: 'auto' }}>

      <div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.3 }}>Convert file</div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 4 }}>
          Video · audio · images · PDF — convert any local file to a different format.
        </div>
      </div>

      {/* Drop zone */}
      {(stage === 'idle' || stage === 'probing') && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={stage === 'idle' ? pickFile : undefined}
          style={{
            flex: 1, minHeight: 220, borderRadius: T.r14,
            border: `2px dashed ${isDragOver ? T.accent : T.borderStrong}`,
            background: isDragOver ? T.accentBg : T.panel,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            cursor: stage === 'idle' ? 'pointer' : 'default',
            transition: 'border-color 0.15s, background 0.15s',
          }}
        >
          {stage === 'probing' ? (
            <>
              <span style={{
                display: 'inline-block', width: 24, height: 24, borderRadius: 12,
                border: `2px solid ${T.accent}`, borderTopColor: 'transparent',
                animation: 'ykspin 0.9s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: T.muted }}>Reading file…</span>
            </>
          ) : (
            <>
              <div style={{
                width: 56, height: 56, borderRadius: 16,
                background: isDragOver ? T.accentBg : 'rgba(255,255,255,0.04)',
                display: 'grid', placeItems: 'center',
              }}>
                <Icon name="download" size={26} stroke={isDragOver ? T.accent : T.muted} strokeWidth={1.5} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: isDragOver ? T.accent : T.text }}>
                  Drop a file here
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{acceptedTypes}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* File info card */}
      {file && stage !== 'idle' && (
        <div style={{
          padding: '12px 16px', borderRadius: T.r14,
          background: T.panel, border: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center',
          }}>
            <Icon
              name={fileType === 'audio' ? 'audio' : fileType === 'image' ? 'image' : fileType === 'pdf' ? 'file' : 'video'}
              size={20} stroke={T.muted}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, color: T.text, fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{file.name}</div>
            <div style={{ fontSize: 11, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>
              {file.sizeMB > 0 ? `${file.sizeMB} MB` : ''}
              {file.sizeMB > 0 && file.durationSecs > 0 ? ' · ' : ''}
              {file.durationSecs > 0 ? fmtTime(file.durationSecs) : ''}
              {file.sizeMB === 0 && file.durationSecs === 0 ? fileType.toUpperCase() : ''}
            </div>
          </div>
          {!isConverting && !isDone && (
            <button onClick={reset} style={{
              background: 'none', border: 'none', color: T.faint, cursor: 'pointer', padding: 4,
            }}>
              <Icon name="x" size={16} stroke={T.faint} />
            </button>
          )}
        </div>
      )}

      {/* Format + quality pickers */}
      {file && (stage === 'ready' || isConverting || isDone) && (
        <div style={{ display: 'flex', gap: 14 }}>
          <FormatPicker selected={fmt} onChange={setFmt} formats={outputFormats} />
          <QualityPicker
            selected={quality}
            format={fmt}
            onChange={setQuality}
            qualities={isImageOrPdf ? qualityList : undefined}
            label={qualityLabel}
            hints={qualityHints}
          />
        </div>
      )}

      <div style={{ flex: 1 }} />

      {/* Convert bar */}
      {file && (stage === 'ready' || isConverting || isDone) && (
        <div style={{
          borderRadius: T.r14, background: T.panelEl, border: `1px solid ${T.borderStrong}`,
          padding: 14, display: 'flex', alignItems: 'center', gap: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          {isConverting && (
            <div style={{ position: 'absolute', inset: 0, opacity: 0.18, pointerEvents: 'none' }}>
              <Waveform bars={120} height={70} color={T.accent} />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: T.accentBg, display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <Icon
                name={format.kind === 'audio' ? 'audio' : format.kind === 'document' ? 'file' : format.kind === 'image' ? 'image' : 'video'}
                size={22} stroke={T.accent} strokeWidth={1.7}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>
                {isConverting
                  ? `Converting${progressLabel ? ` · ${progressLabel}` : ` · ${Math.floor(progress)}%`}`
                  : isDone ? 'Done — saved to Downloads'
                  : `Convert to ${format.label} · ${quality}`}
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, fontFamily: T.mono, marginTop: 2 }}>
                {isDone && outputPath ? outputPath.split(/[\\/]/).pop() : file.name}
              </div>
            </div>
          </div>

          {isConverting && (
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: T.accent, boxShadow: `0 0 12px ${T.accent}`,
                transition: 'width 0.3s',
              }} />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 1 }}>
            {isDone ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => outputPath && window.yoink.file.reveal(outputPath)} style={primaryBtn}>
                  <Icon name="folder" size={14} stroke="#0e1014" strokeWidth={2.2} />
                  Reveal
                </button>
                <button onClick={reset} style={ghostBtn}>Convert another</button>
              </div>
            ) : isConverting ? (
              <button onClick={cancel} style={ghostBtn}>
                <Icon name="x" size={14} stroke={T.text} /> Cancel
              </button>
            ) : (
              <button onClick={convert} style={primaryBtn}>
                Convert <Icon name="arrowR" size={14} stroke="#0e1014" strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function fmtTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const primaryBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 22px', borderRadius: 10, border: 'none',
  background: T.accent, color: '#0e1014', fontFamily: T.font,
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(200,255,58,0.3)',
};

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 8,
  padding: '12px 18px', borderRadius: 10,
  background: 'rgba(255,255,255,0.05)', color: T.text,
  border: `1px solid rgba(255,255,255,0.10)`, fontFamily: T.font,
  fontSize: 13, cursor: 'pointer',
};
