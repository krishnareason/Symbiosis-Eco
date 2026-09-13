#!/bin/bash
# Apply database migrations
python manage.py migrate
# Collect static files for Django Admin
python manage.py collectstatic --noinput
# Start the Celery worker in the background
celery -A symbiosis_proj worker -l info &
# Start the Gunicorn web server in the foreground
gunicorn symbiosis_proj.wsgi:application --bind 0.0.0.0:${PORT:-8000}
