import { useState, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { AUDIO_FORMAT_IDS } from '@yoink/shared';
import type { VideoMeta } from '@yoink/shared';
import { fetchYouTubeInfo, pickBestStream } from '../services/youtube';
import { isValidYouTubeUrl } from '@yoink/shared';

export type DlStage = 'idle' | 'sniffing' | 'ready' | 'downloading' | 'converting' | 'done' | 'error';

export interface DlState {
  stage: DlStage;
  url: string;
  meta: VideoMeta | null;
  fmt: string;
  quality: string;
  progress: number;
  outputPath: string | null;
  error: string | null;
}

export function useYouTubeDownload() {
  const [state, setState] = useState<DlState>({
    stage: 'idle', url: '', meta: null, fmt: 'mp4', quality: '720p',
    progress: 0, outputPath: null, error: null,
  });
  const downloadRef = useRef<FileSystem.DownloadResumable | null>(null);

  const set = (patch: Partial<DlState>) => setState((s) => ({ ...s, ...patch }));

  const setUrl = useCallback((url: string) => {
    set({ url, stage: isValidYouTubeUrl(url) ? 'ready' : 'idle', meta: null, error: null });
  }, []);

  const sniff = useCallback(async (url: string) => {
    if (!isValidYouTubeUrl(url)) return;
    set({ stage: 'sniffing', error: null });
    try {
      const { meta } = await fetchYouTubeInfo(url);
      set({ stage: 'ready', meta });
    } catch (e: any) {
      set({ stage: 'idle', error: e.message ?? 'Failed to fetch metadata' });
    }
  }, []);

  const download = useCallback(async () => {
    const { url, fmt, quality, meta } = state;
    set({ stage: 'downloading', progress: 0, error: null });

    try {
      const { streams } = await fetchYouTubeInfo(url);
      const isAudio = AUDIO_FORMAT_IDS.has(fmt);
      const stream = pickBestStream(streams, !isAudio, quality);
      if (!stream) throw new Error('No suitable stream found');

      const ext = isAudio ? 'webm' : 'mp4';
      const tmpPath = `${FileSystem.cacheDirectory}yoink_tmp_${Date.now()}.${ext}`;

      const dl = FileSystem.createDownloadResumable(
        stream.url,
        tmpPath,
        {},
        ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
          if (totalBytesExpectedToWrite > 0) {
            set({ progress: Math.round((totalBytesWritten / totalBytesExpectedToWrite) * 90) });
          }
        },
      );
      downloadRef.current = dl;
      const result = await dl.downloadAsync();
      if (!result?.uri) throw new Error('Download failed');

      const finalPath = result.uri;

      set({ progress: 95 });
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const asset = await MediaLibrary.saveToLibraryAsync(finalPath);
      }

      set({ stage: 'done', progress: 100, outputPath: finalPath });
    } catch (e: any) {
      set({ stage: 'error', error: e.message ?? 'Download failed' });
    }
  }, [state]);

  const cancel = useCallback(async () => {
    await downloadRef.current?.pauseAsync();
    downloadRef.current = null;
    set({ stage: 'idle', progress: 0 });
  }, []);

  const reset = useCallback(() => {
    setState({ stage: 'idle', url: '', meta: null, fmt: 'mp4', quality: '720p', progress: 0, outputPath: null, error: null });
  }, []);

  return {
    state,
    setUrl,
    setFmt: (fmt: string) => set({ fmt }),
    setQuality: (quality: string) => set({ quality }),
    sniff: () => sniff(state.url),
    download,
    cancel,
    reset,
  };
}
