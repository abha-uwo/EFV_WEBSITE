"""
Django settings for EFV backend.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', os.environ.get('SECRET_KEY', ''))
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('true', '1')
ALLOWED_HOSTS = ['*']
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'
