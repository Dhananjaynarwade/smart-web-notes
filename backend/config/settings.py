import os
from pathlib import Path


# =========================================================
# BASE DIRECTORY
# =========================================================

BASE_DIR = Path(__file__).resolve().parent.parent


# =========================================================
# SECURITY
# =========================================================

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'development-only-secret-key'
)

DEBUG = os.environ.get(
    'DEBUG',
    'False'
).lower() == 'true'


ALLOWED_HOSTS = [
    'smart-web-notes-backend.onrender.com',
    'localhost',
    '127.0.0.1',
]


# =========================================================
# FRONTEND ORIGINS
# =========================================================

CSRF_TRUSTED_ORIGINS = [
    'https://smart-web-notes.onrender.com',
]


CORS_ALLOWED_ORIGINS = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
    'https://smart-web-notes.onrender.com',
]