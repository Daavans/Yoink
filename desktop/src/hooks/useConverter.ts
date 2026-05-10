import { useState, useCallback, useRef } from 'react';
import type { Stage, VideoMeta, ConverterState } from '@yoink/shared';
import { isValidYouTubeUrl, AUDIO_FORMAT_IDS } from '@yoink/shared';

const DEFAULT_STATE: ConverterState = {
  url: '',
  stage: 'idle',
  fmt: 'mp4',
  quality: '1080p',
  trim: [0, 1],
  progress: 0,
  meta: null,
  outputPath: null,
  error: null,
};

export function useConverter() {
  const [state, setState] = useState<ConverterState>(DEFAULT_STATE);
  const unsubRef = useRef<(() => void)[]>([]);

  const setField = useCallback(<K extends keyof ConverterState>(key: K, val: ConverterState[K]) => {
    setState((s) => ({ ...s, [key]: val }));
  }, []);

  const setUrl = useCallback((url: string) => setField('url', url), [setField]);

  const setFormat = useCallback((fmt: string) => {
    setState((s) => {
      const isAudio = AUDIO_FORMAT_IDS.has(fmt);
      const needsQualityReset =
        (isAudio && !['128 kbps','192 kbps','256 kbps','320 kbps'].includes(s.quality)) ||
        (!isAudio && ['128 kbps','192 kbps','256 kbps','320 kbps'].includes(s.quality));
      return {
        ...s,
        fmt,
        quality: needsQualityReset ? (isAudio ? '320 kbps' : '1080p') : s.quality,
      };
    });
  }, []);

  const setQuality = useCallback((quality: string) => setField('quality', quality), [setField]);
  const setTrim = useCallback((trim: [number, number]) => setField('trim', trim), [setField]);

  const sniff = useCallback(async (url?: string) => {
    const targetUrl = url ?? state.url;
    if (!targetUrl.trim()) return;
    if (!isValidYouTubeUrl(targetUrl)) {
      setState((s) => ({ ...s, error: 'Please enter a valid YouTube URL.' }));
      return;
    }
    setState((s) => ({ ...s, url: targetUrl, stage: 'sniffing', error: null, meta: null }));
    try {
      const meta: VideoMeta = await window.yoink.metadata.fetch(targetUrl);
      setState((s) => ({ ...s, stage: 'ready', meta }));
    } catch (e) {
      setState((s) => ({ ...s, stage: 'idle', error: String(e) }));
    }
  }, [state.url]);

  const convert = useCallback(async () => {
    const { url, fmt, quality, trim, meta } = state;
    setState((s) => ({ ...s, stage: 'converting', progress: 0, error: null }));

    const outputDir = '';

    // Subscribe to progress/done/error events
    unsubRef.current.push(
      window.yoink.download.onProgress((data: unknown) => {
        const d = data as { pct: number; eta: string };
        setState((s) => ({ ...s, progress: d.pct }));
      }),
    );
    unsubRef.current.push(
      window.yoink.download.onDone((data: unknown) => {
        const d = data as { outputPath: string };
        unsubRef.current.forEach((u) => u());
        unsubRef.current = [];
        setState((s) => ({ ...s, stage: 'done', progress: 100, outputPath: d.outputPath }));
        // Persist to history
        window.yoink.history.add({
          id: String(Date.now()),
          title: meta?.title ?? 'Unknown',
          format: fmt.toUpperCase(),
          quality,
          sizeMB: 0,
          outputPath: d.outputPath,
          completedAt: Date.now(),
        }).catch(() => {});
      }),
    );
    unsubRef.current.push(
      window.yoink.download.onError((msg: string) => {
        unsubRef.current.forEach((u) => u());
        unsubRef.current = [];
        setState((s) => ({ ...s, stage: 'ready', error: msg }));
      }),
    );

    window.yoink.download.start({
      url, format: fmt, quality, trim,
      outputDir,
      durationSecs: meta?.durationSecs ?? 0,
    });
  }, [state]);

  const cancel = useCallback(() => {
    window.yoink.download.cancel();
    unsubRef.current.forEach((u) => u());
    unsubRef.current = [];
    setState((s) => ({ ...s, stage: 'ready', progress: 0 }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...s, stage: 'ready', progress: 0, outputPath: null, error: null }));
  }, []);

  const reveal = useCallback(() => {
    if (state.outputPath) window.yoink.file.reveal(state.outputPath);
  }, [state.outputPath]);

  return { state, setUrl, setFormat, setQuality, setTrim, sniff, convert, cancel, reset, reveal };
}
