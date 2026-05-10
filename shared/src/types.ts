export type Stage = 'idle' | 'sniffing' | 'ready' | 'converting' | 'done';
export type FormatKind = 'video' | 'audio' | 'image' | 'document';
export type InputFileType = 'video' | 'audio' | 'image' | 'pdf' | 'unknown';

export interface Format {
  id: string;
  label: string;
  kind: FormatKind;
  sub: string;
}

export interface VideoMeta {
  title: string;
  channel: string;
  durationSecs: number;
  views: string;
  thumbnailUrl: string;
  uploadDate: string;
}

export interface HistoryEntry {
  id: string;
  title: string;
  format: string;
  quality: string;
  sizeMB: number;
  outputPath: string;
  completedAt: number;
}

export interface ConverterState {
  url: string;
  stage: Stage;
  fmt: string;
  quality: string;
  trim: [number, number];
  progress: number;
  meta: VideoMeta | null;
  outputPath: string | null;
  error: string | null;
}

export interface DownloadOpts {
  url: string;
  format: string;
  quality: string;
  trim: [number, number];
  outputDir: string;
  durationSecs: number;
}

export interface StorageInfo {
  usedGB: number;
  totalGB: number;
}

export interface FileConvertOpts {
  inputPath: string;
  outputFormat: string;
  quality: string;
  durationSecs: number;
}

export interface FileInfo {
  durationSecs: number;
  sizeMB: number;
}
