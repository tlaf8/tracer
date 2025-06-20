#!/bin/bash
cd /var/www/tracer-api
sudo -u www-data /var/www/tracer-api/venv/bin/gunicorn -w 4 -b 0.0.0.0:9998 app:app
