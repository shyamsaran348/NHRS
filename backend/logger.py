import logging
from logging.handlers import RotatingFileHandler
import os

# Create logs directory if not exists
LOGS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(LOGS_DIR, "nhrs_server.log")

# Setup formatter
LOG_FORMAT = "%(asctime)s | %(levelname)-8s | %(filename)s:%(lineno)d | %(message)s"
formatter = logging.Formatter(LOG_FORMAT)

# Setup Console Handler
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
console_handler.setLevel(logging.INFO)

# Setup Rotating File Handler (Logs rotate at 10MB, keeping 5 backup logs)
file_handler = RotatingFileHandler(
    LOG_FILE_PATH, 
    maxBytes=10 * 1024 * 1024, 
    backupCount=5,
    encoding="utf-8"
)
file_handler.setFormatter(formatter)
file_handler.setLevel(logging.INFO)

# Build Root Logger
logger = logging.getLogger("nhrs_logger")
logger.setLevel(logging.INFO)
logger.addHandler(console_handler)
logger.addHandler(file_handler)

# Suppress duplicate propagates from third-party libraries (e.g. uvicorn handles itself)
logger.propagate = False
