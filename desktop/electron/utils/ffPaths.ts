import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic: string = require('ffmpeg-static');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffprobeInstaller: { path: string } = require('@ffprobe-installer/ffprobe');

/**
 * In a packaged Electron app, native binaries sit in app.asar.unpacked.
 * Replacing 'app.asar/' with 'app.asar.unpacked/' in the module-resolved
 * path is the standard pattern to locate unpacked files at runtime.
 */
function unpack(p: string): string {
  return p.replace(
    'app.asar' + path.sep,
    'app.asar.unpacked' + path.sep,
  );
}

export function getFfmpegPath(): string {
  return unpack(ffmpegStatic);
}

export function getFfprobePath(): string {
  return unpack(ffprobeInstaller.path);
}

/** Directory containing ffmpeg.exe — what yt-dlp expects for --ffmpeg-location */
export function getFfmpegDir(): string {
  return path.dirname(getFfmpegPath());
}
