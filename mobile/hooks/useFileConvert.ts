import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { VIDEO_INPUT_EXTS, AUDIO_INPUT_EXTS, IMAGE_INPUT_EXTS } from '@yoink/shared';
import type { InputFileType } from '@yoink/shared';

export type ConvertStage = 'idle' | 'ready' | 'converting' | 'done' | 'error';

export interface ConvertState {
  stage: ConvertStage;
  inputPath: string | null;
  inputName: string | null;
  inputType: InputFileType;
  fmt: string;
  quality: string;
  progress: number;
  outputPath: string | null;
  error: string | null;
}

function detectType(name: string): InputFileType {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (VIDEO_INPUT_EXTS.has(ext)) return 'video';
  if (AUDIO_INPUT_EXTS.has(ext)) return 'audio';
  if (IMAGE_INPUT_EXTS.has(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'unknown';
}


export function useFileConvert() {
  const [state, setState] = useState<ConvertState>({
    stage: 'idle', inputPath: null, inputName: null, inputType: 'unknown',
    fmt: 'mp4', quality: '1080p', progress: 0, outputPath: null, error: null,
  });

  const set = (patch: Partial<ConvertState>) => setState((s) => ({ ...s, ...patch }));

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled) return;
    const asset = result.assets[0];
    const type = detectType(asset.name);
    const defaultFmt = type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : type === 'image' ? 'jpg' : 'pdf';
    set({ stage: 'ready', inputPath: asset.uri, inputName: asset.name, inputType: type, fmt: defaultFmt, error: null });
  }, []);

  const convert = useCallback(async () => {
    set({ stage: 'error', error: 'File conversion is not yet supported on this version. Use the desktop app for full conversion support.' });
  }, [state]);

  const share = useCallback(async () => {
    if (state.outputPath) await Sharing.shareAsync(state.outputPath);
  }, [state.outputPath]);

  const reset = useCallback(() => {
    setState({ stage: 'idle', inputPath: null, inputName: null, inputType: 'unknown', fmt: 'mp4', quality: '1080p', progress: 0, outputPath: null, error: null });
  }, []);

  return {
    state,
    setFmt: (fmt: string) => set({ fmt }),
    setQuality: (quality: string) => set({ quality }),
    pickFile,
    convert,
    share,
    reset,
  };
}
