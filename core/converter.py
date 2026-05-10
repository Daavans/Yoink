_AUDIO_FORMATS = {"mp3", "wav"}


def get_ydl_postprocessors(format: str) -> list:
    fmt = format.lower()
    if fmt in _AUDIO_FORMATS:
        return [{"key": "FFmpegExtractAudio", "preferredcodec": fmt}]
    return [{"key": "FFmpegVideoConvertor", "preferedformat": fmt}]
