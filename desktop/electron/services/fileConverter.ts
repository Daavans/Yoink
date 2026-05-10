import { spawn, execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { PDFDocument } from 'pdf-lib';
import type { FileConvertOpts, FileInfo } from '../../../shared/src/types';
import { VIDEO_INPUT_EXTS, AUDIO_INPUT_EXTS, IMAGE_INPUT_EXTS } from '../../../shared/src/constants';
import { getFfmpegPath, getFfprobePath } from '../utils/ffPaths';

type Emitter = (event: string, data: unknown) => void;

let activeProc: ReturnType<typeof spawn> | null = null;

// ── Probe ────────────────────────────────────────────────────────────────────

export async function probeFile(inputPath: string): Promise<FileInfo> {
  const ext = path.extname(inputPath).toLowerCase().slice(1);

  if (VIDEO_INPUT_EXTS.has(ext) || AUDIO_INPUT_EXTS.has(ext)) {
    return probeViaFfprobe(inputPath);
  }
  // For images and PDFs: just report file size, no meaningful duration
  const stat = await fs.promises.stat(inputPath);
  return { durationSecs: 0, sizeMB: Math.round((stat.size / 1024 / 1024) * 10) / 10 };
}

function probeViaFfprobe(inputPath: string): Promise<FileInfo> {
  return new Promise((resolve) => {
    execFile(getFfprobePath(), ['-v', 'quiet', '-print_format', 'json', '-show_format', inputPath],
      (_err, stdout) => {
        try {
          const info = JSON.parse(stdout);
          resolve({
            durationSecs: parseFloat(info.format?.duration ?? '0') || 0,
            sizeMB: Math.round((parseInt(info.format?.size ?? '0') / 1024 / 1024) * 10) / 10,
          });
        } catch {
          resolve({ durationSecs: 0, sizeMB: 0 });
        }
      });
  });
}

// ── Save buffer (called for PDF-to-image pages rendered in renderer) ─────────

export async function saveBuffer(data: Uint8Array, outputPath: string): Promise<void> {
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.promises.writeFile(outputPath, data);
}

// ── Image → image (FFmpeg) ────────────────────────────────────────────────────

function imageQualityArgs(quality: string, outputFmt: string): string[] {
  if (outputFmt === 'png') return ['-compression_level', quality === 'original' || quality === 'high' ? '1' : quality === 'medium' ? '5' : '9'];
  if (outputFmt === 'bmp') return [];
  if (outputFmt === 'gif') return [];
  // jpg / webp: -q:v scale (1=best, 31=worst)
  const q = quality === 'original' ? '1' : quality === 'high' ? '2' : quality === 'medium' ? '4' : '8';
  return ['-q:v', q];
}

async function convertImageFFmpeg(opts: FileConvertOpts, emit: Emitter): Promise<string> {
  const { inputPath, outputFormat, quality } = opts;
  const basename = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(os.homedir(), 'Downloads', `${basename}.${outputFormat}`);

  const args = ['-i', inputPath, '-y', '-hide_banner', ...imageQualityArgs(quality, outputFormat), outputPath];
  const proc = spawn(getFfmpegPath(), args);
  activeProc = proc;

  return new Promise((resolve, reject) => {
    let stderrBuf = '';
    proc.stderr.on('data', (c: Buffer) => { stderrBuf += c.toString(); });
    proc.on('close', (code) => {
      activeProc = null;
      if (code === 0) {
        emit('convert:progress', { pct: 100 });
        emit('convert:done', { outputPath });
        resolve(outputPath);
      } else {
        const err = stderrBuf.split('\n').filter((l) => /error/i.test(l)).pop()?.replace(/^.*error:\s*/i, '') ?? 'Image conversion failed';
        emit('convert:error', err.trim());
        reject(new Error(err));
      }
    });
    proc.on('error', (err) => { activeProc = null; emit('convert:error', err.message); reject(err); });
  });
}

// ── Images → PDF (pdf-lib) ───────────────────────────────────────────────────

async function imagesToPdf(imagePaths: string[], emit: Emitter): Promise<string> {
  const pdfDoc = await PDFDocument.create();

  for (let i = 0; i < imagePaths.length; i++) {
    const imgPath = imagePaths[i];
    const imgBytes = await fs.promises.readFile(imgPath);
    const ext = path.extname(imgPath).toLowerCase();

    let img;
    if (ext === '.jpg' || ext === '.jpeg') {
      img = await pdfDoc.embedJpg(imgBytes);
    } else if (ext === '.png') {
      img = await pdfDoc.embedPng(imgBytes);
    } else {
      // For other formats: skip or throw
      continue;
    }

    const page = pdfDoc.addPage([img.width, img.height]);
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
    emit('convert:progress', { pct: Math.round(((i + 1) / imagePaths.length) * 99) });
  }

  const basename = path.basename(imagePaths[0], path.extname(imagePaths[0]));
  const outputPath = path.join(os.homedir(), 'Downloads', `${basename}.pdf`);
  await fs.promises.writeFile(outputPath, await pdfDoc.save());

  emit('convert:progress', { pct: 100 });
  emit('convert:done', { outputPath });
  return outputPath;
}

// ── PDF → compressed PDF (pdf-lib) ───────────────────────────────────────────

async function compressPdf(inputPath: string, emit: Emitter): Promise<string> {
  const inputBytes = await fs.promises.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const basename = path.basename(inputPath, '.pdf');
  const outputPath = path.join(os.homedir(), 'Downloads', `${basename}_compressed.pdf`);
  emit('convert:progress', { pct: 50 });
  const outBytes = await pdfDoc.save({ useObjectStreams: true });
  await fs.promises.writeFile(outputPath, outBytes);
  emit('convert:progress', { pct: 100 });
  emit('convert:done', { outputPath });
  return outputPath;
}

// ── Video / audio converter (FFmpeg) ─────────────────────────────────────────

function buildVideoAudioArgs(input: string, format: string, quality: string, output: string): string[] {
  const args = ['-i', input, '-y', '-hide_banner'];

  if (format === 'mp3') {
    args.push('-vn', '-codec:a', 'libmp3lame', '-b:a', quality.replace(' kbps', '') + 'k');
  } else if (format === 'wav') {
    args.push('-vn', '-codec:a', 'pcm_s16le');
  } else if (format === 'flac') {
    args.push('-vn', '-codec:a', 'flac');
  } else if (format === 'm4a') {
    args.push('-vn', '-codec:a', 'aac', '-b:a', quality.replace(' kbps', '') + 'k');
  } else if (format === 'gif') {
    args.push('-vf', 'fps=12,scale=480:-1:flags=lanczos', '-loop', '0');
  } else {
    const scaleMap: Record<string, string> = { '720p': 'scale=-2:720', '1080p': 'scale=-2:1080', '1440p': 'scale=-2:1440', '4K': 'scale=-2:2160' };
    const scale = scaleMap[quality];
    if (format === 'webm') {
      args.push('-codec:v', 'libvpx-vp9', '-b:v', '0', '-crf', '33', '-codec:a', 'libopus');
    } else {
      args.push('-codec:v', 'libx264', '-preset', 'fast', '-crf', '23', '-codec:a', 'aac', '-b:a', '192k');
    }
    if (scale) args.push('-vf', scale);
  }

  args.push(output);
  return args;
}

async function convertVideoAudio(opts: FileConvertOpts, emit: Emitter): Promise<string> {
  const { inputPath, outputFormat, quality, durationSecs } = opts;
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(os.homedir(), 'Downloads', `${basename}.${outputFormat}`);
  const args = buildVideoAudioArgs(inputPath, outputFormat, quality, outputPath);
  const proc = spawn(getFfmpegPath(), args);
  activeProc = proc;

  return new Promise((resolve, reject) => {
    let stderrBuf = '';
    proc.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stderrBuf += text;
      if (durationSecs > 0) {
        const m = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
        if (m) {
          const secs = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
          emit('convert:progress', { pct: Math.min(99, Math.round((secs / durationSecs) * 100)) });
        }
      }
    });
    proc.on('close', (code) => {
      activeProc = null;
      if (code === 0) {
        emit('convert:progress', { pct: 100 });
        emit('convert:done', { outputPath });
        resolve(outputPath);
      } else {
        const errLine = stderrBuf.split('\n').filter((l) => /error/i.test(l)).pop()?.replace(/^.*error:\s*/i, '') ?? 'Conversion failed';
        emit('convert:error', errLine.trim());
        reject(new Error(errLine));
      }
    });
    proc.on('error', (err) => { activeProc = null; emit('convert:error', err.message); reject(err); });
  });
}

// ── Main dispatcher ───────────────────────────────────────────────────────────

export async function convertFile(opts: FileConvertOpts, emit: Emitter): Promise<string> {
  const ext = path.extname(opts.inputPath).toLowerCase().slice(1);

  if (IMAGE_INPUT_EXTS.has(ext)) {
    if (opts.outputFormat === 'pdf') {
      return imagesToPdf([opts.inputPath], emit);
    }
    return convertImageFFmpeg(opts, emit);
  }

  if (ext === 'pdf') {
    // PDF → compressed PDF only (PDF → images is handled renderer-side via pdfjs)
    return compressPdf(opts.inputPath, emit);
  }

  return convertVideoAudio(opts, emit);
}

export function cancelFileConvert(): void {
  activeProc?.kill();
  activeProc = null;
}
