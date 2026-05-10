import json
import re
from pathlib import Path

_CONFIG_FILE = Path.home() / ".ytconverter_config.json"


def sanitize_filename(name: str) -> str:
    return re.sub(r'[<>:"/\\|?*]', "_", name)


def get_default_output_dir() -> str:
    return str(Path.home() / "Downloads")


def save_last_output_dir(path: str) -> None:
    config = {}
    if _CONFIG_FILE.exists():
        try:
            config = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    config["last_output_dir"] = path
    _CONFIG_FILE.write_text(json.dumps(config), encoding="utf-8")


def load_last_output_dir() -> str:
    if _CONFIG_FILE.exists():
        try:
            config = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
            path = config.get("last_output_dir", "")
            if path and Path(path).is_dir():
                return path
        except (json.JSONDecodeError, OSError):
            pass
    return get_default_output_dir()
