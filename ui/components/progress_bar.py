from PyQt6.QtWidgets import QWidget, QVBoxLayout, QProgressBar, QLabel


class ProgressBarWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(2)

        self._bar = QProgressBar()
        self._bar.setRange(0, 100)
        self._bar.setValue(0)
        layout.addWidget(self._bar)

        self._label = QLabel("")
        layout.addWidget(self._label)

    def set_progress(self, value: int) -> None:
        self._bar.setValue(value)

    def set_status(self, text: str) -> None:
        self._label.setText(text)

    def reset(self) -> None:
        self._bar.setValue(0)
        self._label.setText("")
