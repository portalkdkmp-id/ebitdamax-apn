ARG PHP_VERSION=8.3
ARG NODE_VERSION=22

FROM composer:2 AS composer-bin
FROM node:${NODE_VERSION}-bookworm-slim AS node-bin

FROM php:${PHP_VERSION}-fpm-bookworm AS vendor
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        libcurl4-openssl-dev \
        libicu-dev \
        libfreetype6-dev \
        libjpeg62-turbo-dev \
        libpng-dev \
        libpq-dev \
        libxml2-dev \
        libzip-dev \
        unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        curl \
        gd \
        intl \
        opcache \
        pcntl \
        pdo_pgsql \
        pgsql \
        xml \
        zip \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer-bin /usr/bin/composer /usr/bin/composer
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    --no-scripts

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-interaction

FROM vendor AS frontend
COPY --from=node-bin /usr/local/bin/node /usr/local/bin/node
COPY --from=node-bin /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx \
    && npm ci \
    && npm run build

FROM php:${PHP_VERSION}-fpm-bookworm AS runtime
WORKDIR /var/www/html

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libicu72 \
        libcurl4 \
        libfreetype6 \
        libjpeg62-turbo \
        libpng16-16 \
        libpq5 \
        libxml2 \
        libzip4 \
        nginx-light \
        supervisor \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1000 app \
    && useradd --system --uid 1000 --gid app --home-dir /var/www/html --shell /usr/sbin/nologin app

COPY --from=vendor /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=vendor /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d
COPY --from=vendor /app /var/www/html
COPY --from=frontend /app/public/build /var/www/html/public/build

COPY docker/production/php.ini /usr/local/etc/php/conf.d/zz-production.ini
COPY docker/production/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/production/nginx.conf /etc/nginx/nginx.conf
COPY docker/production/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/production/entrypoint.sh /usr/local/bin/entrypoint

RUN mkdir -p \
        /run/nginx \
        /var/lib/nginx/body \
        /var/lib/nginx/fastcgi \
        /var/log/supervisor \
        /var/www/html/bootstrap/cache \
        /var/www/html/storage/app/private \
        /var/www/html/storage/app/public \
        /var/www/html/storage/framework/cache/data \
        /var/www/html/storage/framework/sessions \
        /var/www/html/storage/framework/testing \
        /var/www/html/storage/framework/views \
        /var/www/html/storage/logs \
    && chown -R app:app \
        /run/nginx \
        /var/lib/nginx \
        /var/log/nginx \
        /var/log/supervisor \
        /var/www/html \
    && chmod +x /usr/local/bin/entrypoint

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stack \
    LOG_STACK=stderr \
    LOG_LEVEL=info \
    PHP_OPCACHE_ENABLE=1

USER app

EXPOSE 8080

ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
