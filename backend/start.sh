#!/bin/sh

# Inject OPENAI_API_KEY from docker-compose env_file into Laravel .env
if [ -n "$OPENAI_API_KEY" ]; then
    sed -i "s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=$OPENAI_API_KEY|" /var/www/.env
fi

if [ -n "$APP_KEY" ]; then
    sed -i "s|^APP_KEY=.*|APP_KEY=$APP_KEY|" /var/www/.env
fi

php artisan config:clear --quiet 2>/dev/null || true

exec php-fpm
