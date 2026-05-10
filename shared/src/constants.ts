import type { Format } from './types';

export const FORMATS: Format[] = [
  { id: 'mp4',  label: 'MP4',  kind: 'video', sub: 'Video · H.264' },
  { id: 'webm', label: 'WEBM', kind: 'video', sub: 'Video · VP9' },
  { id: 'mov',  label: 'MOV',  kind: 'video', sub: 'Video · ProRes' },
  { id: 'gif',  label: 'GIF',  kind: 'image', sub: 'Looping clip' },
  { id: 'mp3',  label: 'MP3',  kind: 'audio', sub: 'Audio · 320 kbps' },
  { id: 'wav',  label: 'WAV',  kind: 'audio', sub: 'Audio · lossless' },
  { id: 'm4a',  label: 'M4A',  kind: 'audio', sub: 'Audio · AAC' },
  { id: 'flac', label: 'FLAC', kind: 'audio', sub: 'Audio · lossless' },
];

export const QUALITIES_VIDEO = ['360p', '720p', '1080p', '1440p', '4K'] as const;
export const QUALITIES_AUDIO = ['128 kbps', '192 kbps', '256 kbps', '320 kbps'] as const;

export const AUDIO_FORMAT_IDS = new Set(['mp3', 'wav', 'm4a', 'flac']);
export const IMAGE_FORMAT_IDS = new Set(['gif']);

export const QUALITY_FORMAT_MAP: Record<string, string> = {
  'best':  'bestvideo+bestaudio/best',
  '360p':  'bestvideo[height<=360]+bestaudio/best',
  '720p':  'bestvideo[height<=720]+bestaudio/best',
  '1080p': 'bestvideo[height<=1080]+bestaudio/best',
  '1440p': 'bestvideo[height<=1440]+bestaudio/best',
  '4K':    'bestvideo[height<=2160]+bestaudio/best',
};

// ── Image / PDF output formats ──────────────────────────────────────────────

export const IMAGE_OUTPUT_FORMATS: Format[] = [
  { id: 'jpg',  label: 'JPG',  kind: 'image',    sub: 'Compressed' },
  { id: 'png',  label: 'PNG',  kind: 'image',    sub: 'Lossless' },
  { id: 'webp', label: 'WEBP', kind: 'image',    sub: 'Web · small' },
  { id: 'bmp',  label: 'BMP',  kind: 'image',    sub: 'Bitmap' },
  { id: 'gif',  label: 'GIF',  kind: 'image',    sub: 'Animated' },
  { id: 'pdf',  label: 'PDF',  kind: 'document', sub: 'Document' },
];

export const PDF_OUTPUT_FORMATS: Format[] = [
  { id: 'png',  label: 'PNG',  kind: 'image',    sub: 'Page images' },
  { id: 'jpg',  label: 'JPG',  kind: 'image',    sub: 'Page images' },
  { id: 'webp', label: 'WEBP', kind: 'image',    sub: 'Page images' },
  { id: 'pdf',  label: 'PDF',  kind: 'document', sub: 'Compress' },
];

export const QUALITIES_IMAGE = ['original', 'high', 'medium', 'low'] as const;

export const VIDEO_INPUT_EXTS = new Set(['mp4','webm','mov','mkv','avi','wmv','flv','ts','m4v','3gp']);
export const AUDIO_INPUT_EXTS = new Set(['mp3','wav','flac','m4a','aac','ogg','opus','wma']);
export const IMAGE_INPUT_EXTS = new Set(['jpg','jpeg','png','webp','bmp','gif','tiff','tif','avif','heic','svg']);

// MB per minute of video/audio at each quality
export const SIZE_RATE: Record<string, number> = {
  '360p':     12,
  '720p':     36,
  '1080p':    74,
  '1440p':   140,
  '4K':      310,
  '128 kbps': 3.5,
  '192 kbps': 5,
  '256 kbps': 7,
  '320 kbps': 8,
};
