from PyQt6.QtWidgets import QWidget, QHBoxLayout, QLabel, QLineEdit, QPushButton
from PyQt6.QtGui import QGuiApplication


class UrlInputWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        layout.addWidget(QLabel("YouTube URL:"))

        self._line_edit = QLineEdit()
        self._line_edit.setPlaceholderText("https://www.youtube.com/watch?v=...")
        layout.addWidget(self._line_edit, stretch=1)

        paste_btn = QPushButton("Paste")
        paste_btn.clicked.connect(self._paste)
        layout.addWidget(paste_btn)

    def _paste(self) -> None:
        clipboard = QGuiApplication.clipboard()
        self._line_edit.setText(clipboard.text())

    @property
    def url(self) -> str:
        return self._line_edit.text().strip()
