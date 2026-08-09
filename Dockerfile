FROM php:8.5-apache

RUN apt update && apt install -y \
    git \
    curl \
    gnupg \
    libpng-dev \
    libjpeg-dev \
    libfreetype-dev \
    libwebp-dev \
    libonig-dev \
    libxml2-dev \
    openssl \
    zip \
    unzip \
    mecab \
    mecab-ipadic-utf8

# Debian's own "default-mysql-client" resolves to the MariaDB client, whose
# ssl-verify-server-cert defaults to on — that fails against the
# docker-compose MySQL service's self-signed cert. Installing the real
# Oracle client instead (default ssl-mode is PREFERRED: encrypted but not
# verified) avoids needing any TLS-verification workaround. Component name
# (mysql-8.4-lts) should track the server version in docker-compose.yml.
RUN curl -fsSL https://repo.mysql.com/RPM-GPG-KEY-mysql-2025 | gpg --dearmor -o /etc/apt/trusted.gpg.d/mysql.gpg \
    && echo "deb https://repo.mysql.com/apt/debian/ trixie mysql-8.4-lts" > /etc/apt/sources.list.d/mysql.list \
    && apt update && apt install -y mysql-community-client

RUN rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure gd --with-jpeg --with-freetype --with-webp
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd
RUN pecl install xdebug redis pcov
RUN docker-php-ext-enable xdebug redis pcov

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
COPY --from=node:24 /usr/local/bin/node /usr/local/bin/node
COPY --from=node:24 /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

RUN useradd --create-home --shell /bin/bash alexnou
USER alexnou:alexnou
