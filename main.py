import sys
import shutil
from pathlib import Path

from PyQt6.QtWidgets import QApplication, QMessageBox
from PyQt6.QtGui import QIcon

from ui.main_window import MainWindow


def _check_ffmpeg() -> bool:
    return shutil.which("ffmpeg") is not None


def main() -> None:
    app = QApplication(sys.argv)
    app.setApplicationName("YT Converter")

    if not _check_ffmpeg():
        QMessageBox.critical(
            None,
            "FFmpeg Not Found",
            "FFmpeg was not found in your PATH.\n\n"
            "Install it and make sure it is available in PATH:\n"
            "  Windows: https://ffmpeg.org/download.html\n"
            "  macOS:   brew install ffmpeg\n"
            "  Linux:   sudo apt install ffmpeg",
        )
        sys.exit(1)

    icon_path = Path(__file__).parent / "assets" / "icon.png"
    if icon_path.exists():
        app.setWindowIcon(QIcon(str(icon_path)))

    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
