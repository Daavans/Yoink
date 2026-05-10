from PyQt6.QtCore import QThread, pyqtSignal

from core import downloader


class Worker(QThread):
    progress_updated = pyqtSignal(int)
    status_changed = pyqtSignal(str)
    log_message = pyqtSignal(str)
    finished = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, url: str, format: str, quality: str, output_dir: str):
        super().__init__()
        self._url = url
        self._format = format
        self._quality = quality
        self._output_dir = output_dir
        self._cancelled = False

    def cancel(self) -> None:
        self._cancelled = True

    def run(self) -> None:
        try:
            self.status_changed.emit("Starting download...")
            self.log_message.emit(f"Downloading: {self._url}")

            output_path = downloader.download(
                url=self._url,
                format=self._format,
                quality=self._quality,
                output_dir=self._output_dir,
                progress_hook=self.progress_updated.emit,
                cancel_flag=lambda: self._cancelled,
            )

            if self._cancelled:
                self.status_changed.emit("Cancelled.")
                self.log_message.emit("Download cancelled by user.")
                return

            self.status_changed.emit("Done.")
            self.log_message.emit(f"Saved to: {output_path}")
            self.finished.emit(output_path)
        except Exception as e:
            self.error.emit(str(e))
