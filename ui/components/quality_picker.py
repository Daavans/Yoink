from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel, QComboBox

_AUDIO_ONLY = {"mp3", "wav"}


class QualityPickerWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        layout.addWidget(QLabel("Quality:"))

        self._combo = QComboBox()
        self._combo.addItems(["Best", "1080p", "720p", "480p", "360p"])
        layout.addWidget(self._combo)

    def update_for_format(self, format_text: str) -> None:
        self.setEnabled(format_text.lower() not in _AUDIO_ONLY)

    @property
    def selected_quality(self) -> str:
        return self._combo.currentText()
