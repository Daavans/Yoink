import type { VideoMeta } from '@yoink/shared';

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

export interface StreamInfo {
  url: string;
  mimeType: string;
  quality: string;
  itag: number;
  hasAudio: boolean;
  hasVideo: boolean;
  bitrate?: number;
}

export async function fetchYouTubeInfo(videoUrl: string): Promise<{
  meta: VideoMeta;
  streams: StreamInfo[];
}> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) throw new Error('Could not extract video ID from URL');

  const res = await fetch(
    'https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        videoId,
        context: {
          client: {
            clientName: 'ANDROID',
            clientVersion: '17.31.35',
            androidSdkVersion: 30,
            hl: 'en',
            gl: 'US',
          },
        },
      }),
    },
  );

  if (!res.ok) throw new Error(`YouTube API error: ${res.status}`);
  const data = await res.json();

  const vd = data.videoDetails ?? {};
  const sd = data.streamingData ?? {};

  const durationSecs = parseInt(vd.lengthSeconds ?? '0', 10);
  const viewCount = parseInt(vd.viewCount ?? '0', 10);
  const views = viewCount > 1_000_000
    ? `${(viewCount / 1_000_000).toFixed(1)}M views`
    : viewCount > 1_000
    ? `${(viewCount / 1_000).toFixed(0)}K views`
    : `${viewCount} views`;

  const thumbnail = (vd.thumbnail?.thumbnails ?? [])
    .sort((a: any, b: any) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? '';

  const meta: VideoMeta = {
    title: vd.title ?? 'Unknown',
    channel: vd.author ?? 'Unknown',
    durationSecs,
    views,
    thumbnailUrl: thumbnail,
    uploadDate: '',
  };

  const allFormats: any[] = [
    ...(sd.formats ?? []),
    ...(sd.adaptiveFormats ?? []),
  ];

  const streams: StreamInfo[] = allFormats
    .filter((f) => f.url)
    .map((f) => ({
      url: f.url,
      mimeType: f.mimeType ?? '',
      quality: f.qualityLabel ?? f.audioQuality ?? '',
      itag: f.itag,
      hasAudio: f.mimeType?.includes('audio') || !!f.audioQuality || (sd.formats ?? []).includes(f),
      hasVideo: f.mimeType?.includes('video'),
      bitrate: f.bitrate,
    }));

  return { meta, streams };
}

export function pickBestStream(
  streams: StreamInfo[],
  wantVideo: boolean,
  qualityLabel: string,
): StreamInfo | null {
  if (wantVideo) {
    // Prefer muxed streams (have both audio+video) for simplicity
    const muxed = streams.filter((s) => s.hasVideo && s.hasAudio);
    if (muxed.length) {
      const qualityMap: Record<string, number> = { '360p': 360, '720p': 720, '1080p': 1080, '1440p': 1440, '4K': 2160 };
      const targetH = qualityMap[qualityLabel] ?? 720;
      return muxed.sort((a, b) => {
        const ah = parseInt(a.quality) || 0;
        const bh = parseInt(b.quality) || 0;
        return Math.abs(ah - targetH) - Math.abs(bh - targetH);
      })[0];
    }
    // Fall back to any video stream
    return streams.find((s) => s.hasVideo) ?? null;
  } else {
    // Audio only — pick highest bitrate audio stream
    const audio = streams.filter((s) => s.hasAudio && !s.hasVideo);
    if (audio.length) return audio.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))[0];
    return streams.find((s) => s.hasAudio) ?? null;
  }
}
