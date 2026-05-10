import re

_YOUTUBE_PATTERNS = [
    r"youtube\.com/watch\?.*v=",
    r"youtu\.be/",
    r"youtube\.com/shorts/",
    r"youtube\.com/playlist\?.*list=",
]


def is_valid_youtube_url(url: str) -> bool:
    return any(re.search(p, url) for p in _YOUTUBE_PATTERNS)
