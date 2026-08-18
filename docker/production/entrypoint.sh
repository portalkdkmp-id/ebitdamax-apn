#!/bin/sh
set -eu

mkdir -p \
    bootstrap/cache \
    storage/app/private \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

if [ "${LARAVEL_STORAGE_LINK:-false}" = "true" ]; then
    php artisan storage:link --force --no-interaction
fi

if [ "${LARAVEL_OPTIMIZE:-true}" = "true" ]; then
    php artisan optimize --no-interaction
fi

exec "$@"
