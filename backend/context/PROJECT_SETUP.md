# Farm Glow Dashboard - Project Setup Guide

## Overview
Complete setup guide for Farm Glow Dashboard - A Laravel 12 multi-tenant SaaS backend for agricultural management with Docker containerization. Simplified setup with app, nginx, and MySQL containers.

## Prerequisites

- Docker and Docker Compose installed
- Git
- 2GB RAM minimum
- 5GB disk space

## Quick Start

### 1. Create Project 
location /home/monsur/Documents
create a folder named farm-glow-backend
```bash
cd farm-glow-backend
```

### 2. Create Docker Files

Create the following Docker configuration files:

## Dockerfile

```dockerfile
FROM php:8.3-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libonig-dev \
    libxml2-dev \
    git \
    curl \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install \
    pdo \
    pdo_mysql \
    mbstring \
    exif \
    pcntl \
    bcmath \
    xml

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install Node.js and npm (already in base image via npm)
RUN npm install -g npm@latest

# Set working directory
WORKDIR /var/www

# Copy application files
COPY . .

# Create storage directory and fix permissions
RUN mkdir -p storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache

# Install PHP dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader || true

# Install Node dependencies
RUN npm install || true

# Expose port
EXPOSE 8000

# Run PHP-FPM
CMD ["php-fpm"]
```

## docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: farm_glow_dashboard
    working_dir: /var/www
    volumes:
      - ./:/var/www
    networks:
      - laravel
      - database_db_network
    environment:
      - DB_HOST=central_mysql
      - DB_PORT=3306
      - DB_DATABASE=farm_glow
      - DB_USERNAME=admin
      - DB_PASSWORD=admin123
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: laravel-nginx
    ports:
      - "8006:80"
      - "443:443"
    volumes:
      - ./:/var/www
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
    networks:
      - laravel
    restart: unless-stopped

networks:
  laravel:
    driver: bridge
  database_db_network:
    external: true
```

## nginx.conf

Create `nginx.conf` in the project root:

```nginx
upstream app {
    server app:8000;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 100M;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Root directory
    root /var/www/public;
    index index.php;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # API and dynamic content
    location / {
        try_files $uri $uri/ @app;
    }

    location @app {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

## Database Schema

**Important**: Database tables are created using Laravel migrations (not SQL init script). This ensures:
- Version control of schema changes
- Proper rollback capability
- Integration with Laravel's migration system

Migration files are created in `database/migrations/` directory and run via:
```bash
php artisan migrate
```

## .env Configuration

Create `.env` file from `.env.example`:

```env
APP_NAME="Farm Glow"
APP_ENV=local
APP_KEY=base64:your-app-key-here
APP_DEBUG=true
APP_URL=http://localhost:8005

# Database Configuration
DB_CONNECTION=mysql
DB_HOST=central_mysql
DB_PORT=3306
DB_DATABASE=farm_glow
DB_USERNAME=admin
DB_PASSWORD=admin123

# Cache Configuration (file-based, can switch to redis later)
CACHE_DRIVER=file
CACHE_TTL=3600

# Session Configuration
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

# Mail Configuration
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@farmglow.local"
MAIL_FROM_NAME="Farm Glow"

# JWT Configuration
JWT_ALGORITHM=HS256
JWT_SECRET=your-jwt-secret-will-be-generated-by-php-artisan-jwt-secret
JWT_TTL=60
JWT_REFRESH_TTL=20160

# Queue Configuration
QUEUE_CONNECTION=sync

# Logging
LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Company/Multi-tenant Configuration
DEFAULT_COMPANY_ID=1

# AWS/Storage Configuration (if needed in future)
FILESYSTEM_DISK=local
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINTS=false

# Audit Configuration
ENABLE_AUDIT_LOGGING=true
```

## Directory Structure

```
farm-glow-dashboard/
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── nginx.conf
├── app/
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
├── storage/
├── tests/
├── public/
├── artisan
├── composer.json
└── package.json
```

**Note**: `docker/` subdirectories are not needed with the simplified setup. Nginx config is placed at project root as `nginx.conf`.

## Setup Steps

### Step 1: Create Laravel 12 Project

```bash
# If starting fresh
composer create-project laravel/laravel farm-glow-dashboard

# Or if upgrading existing project
composer require laravel/framework:^12.0
```

### Step 2: Copy Configuration Files

Copy the files from the documentation above:
- `Dockerfile` → Root directory
- `docker-compose.yml` → Root directory
- `.env.example` → Root directory
- `nginx.conf` → Root directory

### Step 3: Create Storage Directories

```bash
mkdir -p storage/logs
mkdir -p storage/app
mkdir -p bootstrap/cache
chmod -R 775 storage bootstrap/cache
```

### Step 4: Set Environment Variables

```bash
# Copy environment template
cp .env.example .env

# Generate application key (after starting Docker)
docker-compose exec app php artisan key:generate
```

### Step 5: Start Docker Services

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f app
```

### Step 6: Install Dependencies Inside Container

```bash
# Install PHP dependencies
docker-compose exec app composer install

# Install Node dependencies
docker-compose exec app npm install
```

### Step 7: Initialize Database

```bash
# Generate JWT secret
docker-compose exec app php artisan jwt:secret

# Run migrations
docker-compose exec app php artisan migrate

# Seed database with sample data (optional)
docker-compose exec app php artisan db:seed
```

### Step 8: Verify Installation

```bash
# Check Laravel is running
curl http://localhost:8005

# Check API health endpoint
curl http://localhost:8005/api/v1/health

# Check database connection
docker-compose exec central_mysql mysql -u admin -padmin123 farm_glow -e "SHOW TABLES;"
```

## Service Access

| Service | URL/Address | Port |
|---------|-------------|------|
| Laravel API (Direct) | http://localhost:8005 | 8005 |
| Nginx Reverse Proxy | http://localhost:8005 | 80 |
| MySQL | localhost | 3306 |

## Common Commands

### Service Management

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart app

# View logs
docker-compose logs -f app

# View logs from all services
docker-compose logs -f

# Enter container shell
docker-compose exec app bash
```

### Laravel Commands in Container

```bash
# Access container shell
docker-compose exec app bash

# Run artisan commands
docker-compose exec app php artisan <command>

# Examples:
docker-compose exec app php artisan tinker
docker-compose exec app php artisan migrate
docker-compose exec app php artisan migrate:fresh --seed
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan view:clear
docker-compose exec app php artisan test
```

### Database Operations

```bash
# Access MySQL
docker-compose exec central_mysql mysql -u admin -padmin123 farm_glow

# Backup database
docker-compose exec central_mysql mysqldump -u admin -padmin123 farm_glow > backup.sql

# Restore database
docker-compose exec -T central_mysql mysql -u admin -padmin123 farm_glow < backup.sql

# Reset database
docker-compose exec app php artisan migrate:fresh --seed
```

### Cache Management

```bash
# Clear all caches
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:cache
docker-compose exec app php artisan view:clear

# Since CACHE_DRIVER=file, caches are stored in storage/framework/cache/
```

### Frontend Build

```bash
# Watch for changes
docker-compose exec app npm run dev

# Build for production
docker-compose exec app npm run build

# Install new package
docker-compose exec app npm install package-name
```

## Troubleshooting

### Services Won't Start

```bash
# Check service logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Remove all containers and try again
docker-compose down -v
docker-compose up -d
```

### Database Connection Error

```bash
# Wait longer for MySQL to initialize
sleep 30
docker-compose logs central_mysql

# Verify MySQL is healthy
docker-compose exec central_mysql mysqladmin ping -u root -proot_secure_password_change_me

# Reset database
docker-compose down -v
docker-compose up -d
# Wait 30 seconds
docker-compose exec app php artisan migrate --force
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8006
lsof -i :3306
lsof -i :80

# Kill process (replace PID)
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "8006:8000" to "8001:8000"
```

### Permission Errors

```bash
# Fix storage permissions
docker-compose exec app chmod -R 775 storage bootstrap/cache

# Or
docker-compose exec app chown -R www-data:www-data storage bootstrap/cache
```


### JWT Secret Missing

```bash
# Generate JWT secret
docker-compose exec app php artisan jwt:secret --force

# Verify in .env
docker-compose exec app grep JWT_SECRET .env
```

## Production Deployment

For production, update `.env`:

```env
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=warning
LOG_CHANNEL=syslog
```

**Future enhancements for production**:
- Switch CACHE_DRIVER from file to redis (add Redis container to docker-compose.yml)
- Switch QUEUE_CONNECTION from sync to redis (add queue worker service)
- Configure SSL certificates in nginx.conf
- Set up monitoring and logging

## Health Monitoring

```bash
# Check all services are healthy
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100 | grep ERROR

# Monitor system resources
docker stats

# Check database performance
docker-compose exec central_mysql mysql -u admin -padmin123 farm_glow -e "SHOW PROCESSLIST;"
```

## Cleanup

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes data!)
docker-compose down -v

# Remove images
docker rmi farm_glow_app farm_glow_queue farm_glow_scheduler

# Remove all unused Docker resources
docker system prune -a
```

## Security Checklist

- [ ] Change MySQL root password from default
- [ ] Change MySQL user password from default
- [ ] Generate SSL certificates for HTTPS
- [ ] Update JWT_SECRET in environment
- [ ] Set APP_DEBUG=false in production
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Configure backup strategy
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerting

## Next Steps

1. Install required packages:
   ```bash
   composer require tymon/jwt-auth spatie/laravel-permission
   npm install
   ```

2. Publish package configurations:
   ```bash
   docker-compose exec app php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
   docker-compose exec app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
   ```

3. Run migrations and seeders:
   ```bash
   docker-compose exec app php artisan migrate
   docker-compose exec app php artisan db:seed
   ```

4. Generate application keys:
   ```bash
   docker-compose exec app php artisan key:generate
   docker-compose exec app php artisan jwt:secret
   ```

5. Follow the 16-week implementation plan in `FARM_GLOW_COMPLETE_BACKEND.md`

6. Implement API endpoints according to module specifications in `backend/` directory

7. Write tests for all endpoints

8. Deploy to production using Docker Swarm or Kubernetes

## Support

For detailed backend module information, refer to:
- `FARM_GLOW_COMPLETE_BACKEND.md` - Complete backend specification
- `backend/01_AUTHENTICATION.md` - Authentication system
- `backend/02_FARMS.md` - Farm management
- `backend/03_CROPS.md` - Crop management
- `backend/04_LIVESTOCK.md` - Livestock management
- `backend/05_WORKERS.md` - Worker management
- `backend/06_INVENTORY.md` - Inventory management
- `backend/07_FINANCES.md` - Financial management
- `backend/08_USERS.md` - User management
- `backend/09_ROLES_PERMISSIONS.md` - RBAC system

## Configuration Summary

**Database**: 
- Host: central_mysql
- Port: 3306
- Database: farm_glow
- Username: admin
- Password: admin123

**Cache**:
- Driver: File-based (CACHE_DRIVER=file)
- Location: storage/framework/cache/
- Can be upgraded to Redis later if needed

**Queue**:
- Driver: Sync (QUEUE_CONNECTION=sync)
- No background job processing initially
- Can be upgraded to Redis queue later

**API Server**:
- Container: app (PHP-FPM)
- Port: 8000 (internal) / 8005 (external via Nginx)
- Framework: Laravel 12
- PHP Version: 8.3

**Reverse Proxy**:
- Nginx Alpine with gzip compression
- Security headers configured
- Static file serving and caching
