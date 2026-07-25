import logging
import os
from logging.handlers import RotatingFileHandler

LOG_DIR = "logs"
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

log_file = os.path.join(LOG_DIR, "studymate.log")

my_handler = RotatingFileHandler(log_file, mode='a', maxBytes=5*1024*1024, 
                                 backupCount=2, encoding=None, delay=0)
my_handler.setFormatter(log_formatter)
my_handler.setLevel(logging.INFO)

app_log = logging.getLogger("studymate")
app_log.setLevel(logging.INFO)

app_log.addHandler(my_handler)

def get_logger(name="studymate"):
    return logging.getLogger(name)
