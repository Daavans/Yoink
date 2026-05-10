from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel, QComboBox


class FormatPickerWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        layout.addWidget(QLabel("Format:"))

        self._combo = QComboBox()
        self._combo.addItems(["MP3", "MP4", "WEBM", "WAV", "MKV"])
        layout.addWidget(self._combo)

    @property
    def selected_format(self) -> str:
        return self._combo.currentText().lower()

    def currentTextChanged(self):
        return self._combo.currentTextChanged
