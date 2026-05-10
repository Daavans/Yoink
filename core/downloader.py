import yt_dlp
import yt_dlp.utils

from core.converter import get_ydl_postprocessors

_AUDIO_FORMATS = {"mp3", "wav"}

_QUALITY_MAP = {
    "best": "bestvideo+bestaudio/best",
    "1080p": "bestvideo[height<=1080]+bestaudio/best",
    "720p": "bestvideo[height<=720]+bestaudio/best",
    "480p": "bestvideo[height<=480]+bestaudio/best",
    "360p": "bestvideo[height<=360]+bestaudio/best",
}


def download(url: str, format: str, quality: str, output_dir: str,
             progress_hook, cancel_flag) -> str:
    fmt = format.lower()
    is_audio = fmt in _AUDIO_FORMATS
    ydl_format = "bestaudio/best" if is_audio else _QUALITY_MAP.get(quality.lower(), "bestvideo+bestaudio/best")

    last_filename: list[str] = []

    def _hook(d: dict) -> None:
        if cancel_flag():
            raise yt_dlp.utils.DownloadCancelled()
        if d.get("status") == "downloading":
            total = d.get("total_bytes") or d.get("total_bytes_estimate")
            downloaded = d.get("downloaded_bytes", 0)
            if total:
                pct = int(downloaded / total * 100)
                progress_hook(pct)
        elif d.get("status") == "finished":
            last_filename.append(d.get("filename", ""))
            progress_hook(100)

    ydl_opts = {
        "outtmpl": output_dir + "/%(title)s.%(ext)s",
        "format": ydl_format,
        "postprocessors": get_ydl_postprocessors(fmt),
        "progress_hooks": [_hook],
        "quiet": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        if last_filename:
            return last_filename[-1]
        return ydl.prepare_filename(info)
