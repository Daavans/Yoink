import youtubeDl from 'youtube-dl-exec';
import path from 'path';
import os from 'os';
import type { DownloadOpts } from '../../../shared/src/types';
import { AUDIO_FORMAT_IDS, QUALITY_FORMAT_MAP } from '../../../shared/src/constants';
import { isPlaylistUrl } from '../../../shared/src/validators';
import { getFfmpegDir } from '../utils/ffPaths';

type Emitter = (event: string, data: unknown) => void;

let activeProcess: { kill: () => void } | null = null;

export async function startDownload(opts: DownloadOpts, emit: Emitter): Promise<string> {
  const { url, format, quality, trim, outputDir, durationSecs } = opts;
  const isAudio = AUDIO_FORMAT_IDS.has(format);
  const isPlaylist = isPlaylistUrl(url);

  let ydlFormat: string;
  if (isAudio) {
    ydlFormat = 'bestaudio/best';
  } else {
    ydlFormat = QUALITY_FORMAT_MAP[quality] ?? 'bestvideo+bestaudio/best';
  }

  const outputPath = path.join(outputDir || os.homedir() + '/Downloads', '%(title)s.%(ext)s');
  let lastFile = '';

  // Trim section (only when user actually trimmed)
  let downloadSections: string | undefined;
  if (durationSecs > 0 && (trim[0] > 0 || trim[1] < 1)) {
    const startSecs = Math.floor(trim[0] * durationSecs);
    const endSecs = Math.ceil(trim[1] * durationSecs);
    downloadSections = `*${startSecs}-${endSecs}`;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execOpts: any = {
    output: outputPath,
    format: ydlFormat,
    noCheckCertificates: true,
    noWarnings: true,
    quiet: false,
    progress: true,
    noPlaylist: !isPlaylist,
    addHeader: ['referer:youtube.com'],
    ffmpegLocation: getFfmpegDir(),
  };

  if (isAudio) {
    execOpts.extractAudio = true;
    execOpts.audioFormat = format;        // mp3 / wav / m4a / flac
    execOpts.audioQuality = 0;            // best
  } else if (format !== 'webm') {
    execOpts.remuxVideo = format;         // mp4 / mov — fast remux, no re-encode
  }

  if (downloadSections) {
    execOpts.downloadSections = downloadSections;
  }

  const subprocess = youtubeDl.exec(url, execOpts);
  activeProcess = subprocess;

  return new Promise((resolve, reject) => {
    let lastPct = 0;
    let stderrBuf = '';

    subprocess.stdout?.on('data', (chunk: Buffer) => {
      const line = chunk.toString();

      const pctMatch = line.match(/(\d+\.?\d*)%/);
      if (pctMatch) {
        const pct = Math.min(99, parseFloat(pctMatch[1]));
        if (pct > lastPct) {
          lastPct = pct;
          const etaMatch = line.match(/ETA\s+(\S+)/);
          emit('download:progress', { pct, eta: etaMatch?.[1] ?? '' });
        }
      }

      const destMatch = line.match(/\[(?:download|Merger|ExtractAudio)\]\s+Destination:\s+(.+)/);
      if (destMatch) lastFile = destMatch[1].trim();
    });

    // Capture stderr so we can surface the real error to the user
    subprocess.stderr?.on('data', (chunk: Buffer) => {
      stderrBuf += chunk.toString();
    });

    subprocess.on('close', (code: number | null) => {
      activeProcess = null;
      if (code === 0 || code === null) {
        emit('download:progress', { pct: 100, eta: '' });
        emit('download:done', { outputPath: lastFile });
        resolve(lastFile);
      } else {
        // Pull the last meaningful ERROR line from yt-dlp stderr
        const errLine = stderrBuf
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .reverse()
          .find((l) => l.toLowerCase().includes('error') || l.startsWith('WARNING'));

        const err = errLine
          ? errLine.replace(/^ERROR:\s*/i, '')
          : 'Download failed — check that the URL is valid and the video is not age-restricted.';

        emit('download:error', err);
        reject(new Error(err));
      }
    });

    subprocess.on('error', (err: Error) => {
      activeProcess = null;
      emit('download:error', err.message);
      reject(err);
    });
  });
}

export function cancelDownload(): void {
  activeProcess?.kill();
  activeProcess = null;
}
