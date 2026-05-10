from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLineEdit, QFileDialog, QLabel, QMessageBox,
)
from PyQt6.QtCore import Qt

from ui.components.url_input import UrlInputWidget
from ui.components.format_picker import FormatPickerWidget
from ui.components.quality_picker import QualityPickerWidget
from ui.components.progress_bar import ProgressBarWidget
from ui.components.output_log import OutputLogWidget
from core.worker import Worker
from utils import validators, file_manager


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("YT Converter")
        self.setFixedWidth(520)

        self._worker = None

        central = QWidget()
        self.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setSpacing(8)
        layout.setContentsMargins(12, 12, 12, 12)

        # URL input
        self._url_input = UrlInputWidget()
        layout.addWidget(self._url_input)

        # Format + Quality row
        fmt_quality_row = QHBoxLayout()
        self._format_picker = FormatPickerWidget()
        self._quality_picker = QualityPickerWidget()
        self._format_picker._combo.currentTextChanged.connect(
            self._quality_picker.update_for_format
        )
        fmt_quality_row.addWidget(self._format_picker)
        fmt_quality_row.addWidget(self._quality_picker)
        layout.addLayout(fmt_quality_row)

        # Save-to folder row
        folder_row = QHBoxLayout()
        folder_row.addWidget(QLabel("Save to:"))
        self._folder_edit = QLineEdit()
        self._folder_edit.setDisabled(True)
        self._folder_edit.setText(file_manager.load_last_output_dir())
        folder_row.addWidget(self._folder_edit, stretch=1)
        browse_btn = QPushButton("Browse")
        browse_btn.clicked.connect(self._browse_folder)
        folder_row.addWidget(browse_btn)
        layout.addLayout(folder_row)

        # Convert / Cancel buttons
        btn_row = QHBoxLayout()
        btn_row.setAlignment(Qt.AlignmentFlag.AlignCenter)

        self._convert_btn = QPushButton("Convert")
        self._convert_btn.setStyleSheet("font-weight: bold; font-size: 14px; padding: 6px 24px;")
        self._convert_btn.clicked.connect(self._start_conversion)
        btn_row.addWidget(self._convert_btn)

        self._cancel_btn = QPushButton("Cancel")
        self._cancel_btn.setEnabled(False)
        self._cancel_btn.clicked.connect(self._cancel_conversion)
        btn_row.addWidget(self._cancel_btn)

        layout.addLayout(btn_row)

        # Progress bar
        self._progress = ProgressBarWidget()
        layout.addWidget(self._progress)

        # Output log
        self._log = OutputLogWidget()
        layout.addWidget(self._log)

        self.adjustSize()

    def _browse_folder(self) -> None:
        folder = QFileDialog.getExistingDirectory(
            self, "Select Output Folder", self._folder_edit.text()
        )
        if folder:
            self._folder_edit.setText(folder)
            file_manager.save_last_output_dir(folder)

    def _start_conversion(self) -> None:
        url = self._url_input.url
        if not validators.is_valid_youtube_url(url):
            QMessageBox.warning(self, "Invalid URL", "Please enter a valid YouTube URL.")
            return

        fmt = self._format_picker.selected_format
        quality = self._quality_picker.selected_quality
        output_dir = self._folder_edit.text()

        self._progress.reset()
        self._log.clear()
        self._convert_btn.setEnabled(False)
        self._cancel_btn.setEnabled(True)

        self._worker = Worker(url, fmt, quality, output_dir)
        self._worker.progress_updated.connect(self._progress.set_progress)
        self._worker.status_changed.connect(self._progress.set_status)
        self._worker.log_message.connect(self._log.append_line)
        self._worker.finished.connect(self._on_finished)
        self._worker.error.connect(self._on_error)
        self._worker.start()

    def _cancel_conversion(self) -> None:
        if self._worker:
            self._worker.cancel()
        self._reset_buttons()

    def _on_finished(self, output_path: str) -> None:
        self._reset_buttons()
        QMessageBox.information(self, "Done", f"Saved to:\n{output_path}")

    def _on_error(self, message: str) -> None:
        self._reset_buttons()
        self._log.append_line(f"Error: {message}")
        QMessageBox.critical(self, "Error", message)

    def _reset_buttons(self) -> None:
        self._convert_btn.setEnabled(True)
        self._cancel_btn.setEnabled(False)
