# YT Converter — Claude Code Instructions

## Project Overview

A desktop application that converts YouTube videos to audio/video formats (MP3, MP4, WEBM, WAV, MKV).
Built with PyQt6 for the UI, yt-dlp for downloading, and FFmpeg for conversion.
The app runs entirely locally — no server, no internet dependency beyond the actual YouTube download.

---

## Tech Stack

- **Language:** Python 3.11+
- **UI:** PyQt6
- **Downloader:** yt-dlp (pip package)
- **Converter:** FFmpeg (system binary, called via yt-dlp or subprocess)
- **Packaging:** PyInstaller (for final .exe / .app build)

---

## Project Structure

```
yt-converter/
│
├── CLAUDE.md                  # This file
├── requirements.txt           # Python dependencies
├── main.py                    # Entry point — creates QApplication and launches MainWindow
│
├── ui/
│   ├── main_window.py         # Main QMainWindow — assembles all components
│   └── components/
│       ├── url_input.py       # QLineEdit + Paste button widget
│       ├── format_picker.py   # QComboBox for format selection
│       ├── quality_picker.py  # QComboBox for quality selection
│       ├── progress_bar.py    # QProgressBar + status label
│       └── output_log.py      # QTextEdit (read-only) for live status messages
│
├── core/
│   ├── downloader.py          # yt-dlp wrapper
│   ├── converter.py           # FFmpeg / yt-dlp post-processing config
│   └── worker.py              # QThread subclass — runs download+convert off main thread
│
├── utils/
│   ├── file_manager.py        # Output path, filename sanitization, folder memory
│   └── validators.py          # YouTube URL validation before starting
│
└── assets/
    └── icon.png               # App window icon
```

---

## File-by-File Instructions

### `main.py`
- Create a `QApplication` instance
- Instantiate and show `MainWindow`
- Set the app name to `"YT Converter"`
- Set the window icon from `assets/icon.png`
- Call `sys.exit(app.exec())`

---

### `ui/main_window.py`
- Subclass `QMainWindow`
- Window title: `"YT Converter"`
- Fixed width: 520px. Height: auto-fit content, not resizable
- Layout (top to bottom, using QVBoxLayout):
  1. `UrlInputWidget`
  2. A horizontal row: `FormatPickerWidget` + `QualityPickerWidget` side by side
  3. Save-to folder row: `QLineEdit` (disabled, shows path) + `Browse` button (opens `QFileDialog`)
  4. A centered `Convert` button (QPushButton, bold, larger font)
  5. `ProgressBarWidget`
  6. `OutputLogWidget`
- The `Convert` button calls `self._start_conversion()`
- `_start_conversion()` should:
  1. Call `validators.is_valid_youtube_url()` — show `QMessageBox.warning` if invalid
  2. Read URL, format, quality, output folder
  3. Instantiate `Worker` with those params
  4. Connect worker signals to UI update slots
  5. Call `worker.start()`
- While worker is running: disable the Convert button, enable a Cancel button
- On worker finish or error: re-enable Convert, disable Cancel

---

### `ui/components/url_input.py`
- A `QWidget` containing a `QLabel` ("YouTube URL:"), a `QLineEdit`, and a `QPushButton` ("Paste")
- The Paste button reads from `QApplication.clipboard()` and puts it in the `QLineEdit`
- Expose a `url` property that returns the current text stripped of whitespace

---

### `ui/components/format_picker.py`
- A `QWidget` with a `QLabel` ("Format:") and a `QComboBox`
- Options: `MP3`, `MP4`, `WEBM`, `WAV`, `MKV`
- Default selection: `MP3`
- Expose a `selected_format` property returning the current text in lowercase

---

### `ui/components/quality_picker.py`
- A `QWidget` with a `QLabel` ("Quality:") and a `QComboBox`
- Options: `Best`, `1080p`, `720p`, `480p`, `360p`
- Default selection: `Best`
- Expose a `selected_quality` property returning the current text
- When format is `MP3` or `WAV` (audio-only), disable this widget — quality doesn't apply

---

### `ui/components/progress_bar.py`
- A `QWidget` containing a `QProgressBar` and a `QLabel` below it for status text
- `QProgressBar` range: 0–100
- Expose:
  - `set_progress(value: int)` — updates the bar
  - `set_status(text: str)` — updates the label
  - `reset()` — sets bar to 0, clears label

---

### `ui/components/output_log.py`
- A read-only `QTextEdit`
- Fixed height: ~100px
- Expose `append_line(text: str)` which appends a line and auto-scrolls to bottom
- Expose `clear()` to wipe the log

---

### `core/worker.py`
- Subclass `QThread`
- Constructor takes: `url: str`, `format: str`, `quality: str`, `output_dir: str`
- Define these **signals**:
  - `progress_updated = pyqtSignal(int)` — integer 0–100
  - `status_changed = pyqtSignal(str)` — human-readable status string
  - `log_message = pyqtSignal(str)` — detailed log line
  - `finished = pyqtSignal(str)` — emits the final output file path
  - `error = pyqtSignal(str)` — emits error message string
- Override `run()`:
  1. Emit `status_changed("Validating URL...")`
  2. Call `downloader.download()` passing a progress hook that emits `progress_updated`
  3. Emit `status_changed("Converting...")` then call `converter.convert()` if needed
  4. Emit `finished(output_path)` on success
  5. Catch all exceptions and emit `error(str(e))`
- Implement a `cancel()` method that sets a flag checked inside the download hook

---

### `core/downloader.py`
- Function: `download(url, format, quality, output_dir, progress_hook, cancel_flag) -> str`
- Returns the path of the downloaded file
- Use `yt_dlp.YoutubeDL` with an options dict:
  - `outtmpl`: `output_dir + "/%(title)s.%(ext)s"`
  - `format`: map quality strings to yt-dlp format selectors:
    - `Best` → `"bestvideo+bestaudio/best"`
    - `1080p` → `"bestvideo[height<=1080]+bestaudio/best"`
    - `720p` → `"bestvideo[height<=720]+bestaudio/best"`
    - etc.
  - For audio-only formats (MP3, WAV): use `"bestaudio/best"`
  - `progress_hooks`: wrap `progress_hook` to emit percentage from yt-dlp's hook dict
  - `quiet`: `True` (suppress yt-dlp's own stdout)
- Check `cancel_flag` inside the progress hook; if set, raise `yt_dlp.utils.DownloadCancelled`

---

### `core/converter.py`
- Function: `get_ydl_postprocessors(format: str) -> list`
- Returns a yt-dlp postprocessor config list based on the chosen format
- For audio formats (MP3, WAV):
  - Return `[{"key": "FFmpegExtractAudio", "preferredcodec": format.lower()}]`
- For video formats (MP4, MKV, WEBM):
  - Return `[{"key": "FFmpegVideoConvertor", "preferedformat": format.lower()}]`
- These are passed into the yt-dlp options dict under `"postprocessors"` in `downloader.py`
- Note: This means FFmpeg does the conversion automatically as part of yt-dlp's pipeline — no separate subprocess needed

---

### `utils/validators.py`
- Function: `is_valid_youtube_url(url: str) -> bool`
- Check against these patterns:
  - `youtube.com/watch?v=`
  - `youtu.be/`
  - `youtube.com/shorts/`
  - `youtube.com/playlist?list=`
- Return `True` if any match, `False` otherwise
- Do a basic regex check only — do not make a network request here

---

### `utils/file_manager.py`
- Function: `sanitize_filename(name: str) -> str` — strips characters illegal in filenames
- Function: `get_default_output_dir() -> str` — returns the user's Downloads folder (cross-platform via `pathlib`)
- Function: `save_last_output_dir(path: str)` — saves to a local config file (e.g. `~/.ytconverter_config.json`)
- Function: `load_last_output_dir() -> str` — loads from config file, falls back to Downloads if missing

---

### `requirements.txt`
```
PyQt6
yt-dlp
pyinstaller
```

FFmpeg must be installed separately as a system binary and available in PATH.
Include a check at startup: if `ffmpeg` is not found in PATH, show a `QMessageBox.critical` with installation instructions and exit.

---

## Key Behaviors & Rules

- **Never run yt-dlp or FFmpeg on the main thread.** Always use `Worker` (QThread).
- **Always validate the URL** before starting a conversion.
- **Cancel must work mid-download** — the cancel flag must be checked inside the yt-dlp progress hook.
- **Progress bar** should reflect real yt-dlp progress (it provides a percentage in its hook dict).
- **Output filename** comes from the video title (yt-dlp handles this via `%(title)s`).
- **Save folder** is remembered between sessions via `file_manager.save/load_last_output_dir`.
- **Error messages** must always reach the user via `QMessageBox` — never silently fail.
- **FFmpeg check** happens once at app startup before the window is shown.

---

## Build Order

Build and test in this order — do not skip ahead:

1. `utils/validators.py` — test with sample URLs
2. `core/downloader.py` — test standalone with a short video URL
3. `core/converter.py` — verify postprocessor configs are correct
4. `core/worker.py` — test signals fire correctly with a simple QThread test
5. `ui/components/` — build each widget individually
6. `ui/main_window.py` — assemble all components, wire to worker
7. `main.py` — entry point, FFmpeg check, launch
8. Final: package with PyInstaller

---

## FFmpeg Installation Note (for README)

- **Windows:** Download from https://ffmpeg.org/download.html and add to PATH
- **macOS:** `brew install ffmpeg`
- **Linux:** `sudo apt install ffmpeg`
