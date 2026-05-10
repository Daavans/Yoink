from PyQt6.QtWidgets import QTextEdit


class OutputLogWidget(QTextEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setReadOnly(True)
        self.setFixedHeight(100)

    def append_line(self, text: str) -> None:
        self.append(text)
        self.verticalScrollBar().setValue(self.verticalScrollBar().maximum())

    def clear(self) -> None:
        super().clear()
