# Farm Glow Dashboard - Complete Laravel 12 Backend Guide
## Single File - All-in-One Development Reference

**Project:** Farm Glow Dashboard Backend  
**Tech Stack:** Laravel 12, PHP 8.3+, MySQL 8.0+  
**Architecture:** Multi-Tenant with company_id isolation  
**Total Duration:** 16 weeks  
**Last Updated:** April 2026

---

## TABLE OF CONTENTS
1. [Quick Start](#quick-start)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Phase-by-Phase Tasks](#phase-by-phase-tasks)
5. [Code Templates](#code-templates)
6. [Testing Guide](#testing-guide)
7. [Deployment](#deployment)

---

## QUICK START

### Prerequisites
```
Docker 20.10+ and Docker Compose 2.0+
```

### Docker Setup (Recommended)
```bash
# Clone/setup project
git clone <repo> farm-glow-dashboard
cd farm-glow-dashboard

# Start all services (MySQL, Redis, Laravel app)
docker-compose up -d

# Install dependencies
docker-compose exec app composer install

# Install Spatie Permission
docker-compose exec app composer require spatie/laravel-permission

# Generate keys & setup
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan jwt:secret

# Publish Spatie Permission config
docker-compose exec app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Run migrations & seeders
docker-compose exec app php artisan migrate --seed

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:8006
# MySQL: localhost:3306
# Redis: localhost:6379

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Local Setup (Without Docker)

Prerequisites:
```
PHP 8.3+, Composer, MySQL 8.0+, Redis 7.0+
```

Setup Commands:
```bash
# Create project
composer create-project laravel/laravel farm-glow-dashboard
cd farm-glow-dashboard

# Install packages
composer require tymon/jwt-auth laravel/sanctum laravel/tinker spatie/laravel-permission

# Setup .env
cp .env.example .env
php artisan key:generate
php artisan jwt:secret

# Create database
mysql -u root -p -e "CREATE DATABASE farm_glow;"

# Run migrations & seeders
php artisan migrate --seed

# Start server
php artisan serve
```

---

## DATABASE SCHEMA

### Core Tables (MySQL)

```sql
-- Companies Table (Master Tenant)
CREATE TABLE companies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    logo_url VARCHAR(255),
    subscription_plan ENUM('free','basic','premium','enterprise') DEFAULT 'free',
    subscription_status ENUM('active','inactive','suspended') DEFAULT 'active',
    subscription_start_date DATE,
    subscription_end_date DATE,
    max_users INT DEFAULT 1,
    max_farms INT DEFAULT 1,
    features_enabled JSON,
    owner_user_id INT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_created_at (created_at),
    FOREIGN KEY (owner_user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Users Table (with company_id for multi-tenancy)
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    role ENUM('owner','admin','farmer','worker') DEFAULT 'farmer',
    is_active BOOLEAN DEFAULT true,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY unique_email_per_company (company_id, email),
    INDEX idx_company_id (company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Farms Table
CREATE TABLE farms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    total_area DECIMAL(10,2),
    description TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm (company_id, id),
    INDEX idx_company_user (company_id, user_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Fields Table
CREATE TABLE fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    area DECIMAL(10,2),
    location VARCHAR(255),
    coordinates JSON,
    soil_type VARCHAR(100),
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm (company_id, farm_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Crops Table
CREATE TABLE crops (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    field_id INT,
    name VARCHAR(255) NOT NULL,
    variety VARCHAR(255),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    actual_harvest_date DATE,
    quantity_planted DECIMAL(10,2),
    yield DECIMAL(10,2),
    status ENUM('planning','growing','harvested') DEFAULT 'planning',
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm_status (company_id, farm_id, status),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (field_id) REFERENCES fields(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Crop Health Records
CREATE TABLE crop_health_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    crop_id INT NOT NULL,
    record_date DATE NOT NULL,
    health_status VARCHAR(100),
    treatment TEXT,
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_crop (company_id, crop_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (crop_id) REFERENCES crops(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Livestock Types
CREATE TABLE livestock_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_global BOOLEAN DEFAULT false,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY unique_name_per_company (company_id, name),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Sheds Table
CREATE TABLE sheds (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    capacity INT,
    current_occupancy INT DEFAULT 0,
    location VARCHAR(255),
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm (company_id, farm_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Livestock Table
CREATE TABLE livestock (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    shed_id INT,
    type_id INT,
    animal_id VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    breed VARCHAR(100),
    date_of_birth DATE,
    gender ENUM('male','female'),
    weight DECIMAL(10,2),
    health_status VARCHAR(100),
    acquisition_date DATE,
    status ENUM('active','inactive','sold') DEFAULT 'active',
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    UNIQUE KEY unique_animal_per_company (company_id, animal_id),
    INDEX idx_company_farm_status (company_id, farm_id, status),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (shed_id) REFERENCES sheds(id),
    FOREIGN KEY (type_id) REFERENCES livestock_types(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Livestock Health Records
CREATE TABLE livestock_health_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    livestock_id INT NOT NULL,
    record_date DATE NOT NULL,
    health_status VARCHAR(100),
    treatment TEXT,
    veterinarian VARCHAR(100),
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_livestock (company_id, livestock_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (livestock_id) REFERENCES livestock(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Breeding Records
CREATE TABLE breeding_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    livestock_id INT NOT NULL,
    breeding_date DATE NOT NULL,
    sire_id INT,
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_livestock (company_id, livestock_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (livestock_id) REFERENCES livestock(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Workers Table
CREATE TABLE workers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    user_id INT,
    position VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    status ENUM('active','inactive','on_leave') DEFAULT 'active',
    phone VARCHAR(20),
    emergency_contact VARCHAR(100),
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm_status (company_id, farm_id, status),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Work Schedules
CREATE TABLE work_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    worker_id INT NOT NULL,
    task VARCHAR(255),
    scheduled_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_worker_date (company_id, worker_id, scheduled_date),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (worker_id) REFERENCES workers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Attendance Table
CREATE TABLE attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    worker_id INT NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    hours_worked DECIMAL(5,2),
    status ENUM('present','absent','late','on_leave') DEFAULT 'present',
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_worker_date (company_id, worker_id, date),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (worker_id) REFERENCES workers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Suppliers Table
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    products TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_name (company_id, name),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Inventory Table
CREATE TABLE inventory (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    quantity DECIMAL(12,2),
    unit VARCHAR(50),
    reorder_level DECIMAL(12,2),
    supplier_id INT,
    cost_per_unit DECIMAL(10,2),
    expiry_date DATE,
    sku VARCHAR(100),
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm_category (company_id, farm_id, category),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Inventory Usage
CREATE TABLE inventory_usage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    inventory_id INT NOT NULL,
    quantity_used DECIMAL(12,2) NOT NULL,
    usage_date DATE NOT NULL,
    usage_type VARCHAR(100),
    notes TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_inventory_date (company_id, inventory_id, usage_date),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (inventory_id) REFERENCES inventory(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Finances Table
CREATE TABLE finances (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    farm_id INT,
    type ENUM('income','expense') NOT NULL,
    category VARCHAR(100),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    reference VARCHAR(100),
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_farm_date (company_id, farm_id, date),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (farm_id) REFERENCES farms(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Notifications Table
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    user_id INT NOT NULL,
    title VARCHAR(255),
    message TEXT,
    type ENUM('alert','reminder','info','warning') DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP NULL,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_user_created (company_id, user_id, created_at),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);

-- Audit Logs
CREATE TABLE company_audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    user_id INT,
    entity_type VARCHAR(100),
    entity_id INT,
    action ENUM('create','update','delete') NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_by INT,
    deleted_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_company_created (company_id, created_at),
    INDEX idx_company_entity (company_id, entity_type, entity_id),
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (deleted_by) REFERENCES users(id)
);
```

---

## SPATIE PERMISSION SETUP

### Installation & Configuration

Spatie Laravel Permission provides a complete role-permission management system.

#### 1. Install Package

```bash
# Docker
docker-compose exec app composer require spatie/laravel-permission

# Local
composer require spatie/laravel-permission
```

#### 2. Publish Configuration

```bash
# Docker
docker-compose exec app php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"

# Local
php artisan vendor:publish --provider="Spatie\Permission\PermissionServiceProvider"
```

#### 3. Run Migrations

```bash
# Docker
docker-compose exec app php artisan migrate

# Local
php artisan migrate
```

This creates 3 tables:
- `permissions` - Individual permissions (e.g., "create_crops", "delete_farms")
- `roles` - Role definitions (e.g., "owner", "admin", "farmer", "worker")
- `role_has_permissions` - Maps permissions to roles

#### 4. Update User Model

```php
<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    
    // ... rest of model
}
```

### Roles & Permissions Setup

#### 1. Seeder - DatabaseSeeder.php

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use App\Models\Company;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ Reset cached permissions & roles
        app()['cache']->forget('spatie.permission.cache');

        // Define all permissions
        $permissions = [
            // Company Permissions
            'view_company', 'edit_company', 'delete_company',
            
            // User Permissions
            'view_users', 'create_users', 'edit_users', 'delete_users',
            
            // Farm Permissions
            'view_farms', 'create_farms', 'edit_farms', 'delete_farms',
            
            // Field Permissions
            'view_fields', 'create_fields', 'edit_fields', 'delete_fields',
            
            // Crop Permissions
            'view_crops', 'create_crops', 'edit_crops', 'delete_crops', 'harvest_crops',
            
            // Livestock Permissions
            'view_livestock', 'create_livestock', 'edit_livestock', 'delete_livestock',
            'view_sheds', 'create_sheds', 'edit_sheds', 'delete_sheds',
            
            // Worker Permissions
            'view_workers', 'create_workers', 'edit_workers', 'delete_workers',
            'manage_schedules', 'manage_attendance',
            
            // Inventory Permissions
            'view_inventory', 'create_inventory', 'edit_inventory', 'delete_inventory',
            'manage_suppliers',
            
            // Financial Permissions
            'view_finances', 'create_finances', 'edit_finances', 'delete_finances',
            'view_reports', 'generate_reports',
            
            // System Permissions
            'view_audit_logs', 'manage_roles', 'manage_permissions',
        ];

        // Create all permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'api']);
        }

        // Define roles
        $roles = [
            'owner' => $permissions, // Owner has all permissions
            'admin' => array_filter($permissions, fn($p) => !in_array($p, ['delete_company', 'manage_roles', 'manage_permissions'])),
            'farmer' => [
                'view_company', 'view_farms', 'create_farms', 'edit_farms',
                'view_fields', 'create_fields', 'edit_fields', 'delete_fields',
                'view_crops', 'create_crops', 'edit_crops', 'delete_crops', 'harvest_crops',
                'view_livestock', 'create_livestock', 'edit_livestock',
                'view_sheds', 'create_sheds', 'edit_sheds',
                'view_workers', 'view_inventory', 'view_finances', 'generate_reports',
            ],
            'worker' => [
                'view_company', 'view_farms', 'view_crops',
                'view_livestock', 'view_sheds',
                'manage_attendance', 'view_inventory',
            ],
        ];

        // Create roles and assign permissions
        foreach ($roles as $roleName => $perms) {
            $role = Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'api']);
            $role->syncPermissions($perms);
        }

        // Create sample company with users
        $company = Company::firstOrCreate([
            'email' => 'owner@farmglow.local'
        ], [
            'name' => 'Farm Glow Demo',
            'subscription_plan' => 'enterprise',
        ]);

        // Create owner user
        $owner = User::firstOrCreate([
            'email' => 'owner@farmglow.local'
        ], [
            'company_id' => $company->id,
            'password' => bcrypt('password'),
            'first_name' => 'Farm',
            'last_name' => 'Owner',
            'role' => 'owner',
        ]);
        $owner->assignRole('owner');

        // Create admin user
        $admin = User::firstOrCreate([
            'email' => 'admin@farmglow.local'
        ], [
            'company_id' => $company->id,
            'password' => bcrypt('password'),
            'first_name' => 'Farm',
            'last_name' => 'Admin',
            'role' => 'admin',
        ]);
        $admin->assignRole('admin');

        // Create farmer user
        $farmer = User::firstOrCreate([
            'email' => 'farmer@farmglow.local'
        ], [
            'company_id' => $company->id,
            'password' => bcrypt('password'),
            'first_name' => 'John',
            'last_name' => 'Farmer',
            'role' => 'farmer',
        ]);
        $farmer->assignRole('farmer');

        // Create worker user
        $worker = User::firstOrCreate([
            'email' => 'worker@farmglow.local'
        ], [
            'company_id' => $company->id,
            'password' => bcrypt('password'),
            'first_name' => 'Mike',
            'last_name' => 'Worker',
            'role' => 'worker',
        ]);
        $worker->assignRole('worker');
    }
}
```

### Usage in Controllers

#### Check Single Permission

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class CropController extends Controller
{
    public function store(Request $request)
    {
        // Check if user has permission
        if (!auth()->user()->can('create_crops')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Create crop...
    }

    public function update(Request $request, $id)
    {
        // Check specific permission
        if (!auth()->user()->can('edit_crops')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Update crop...
    }

    public function destroy($id)
    {
        // Multiple permissions check
        if (!auth()->user()->can('delete_crops')) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Delete crop...
    }
}
```

#### Using Middleware

Create middleware file: `app/Http/Middleware/CheckPermission.php`

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPermission
{
    public function handle(Request $request, Closure $next, ...$permissions)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        foreach ($permissions as $permission) {
            if (!auth()->user()->can($permission)) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }
        }

        return $next($request);
    }
}
```

Register in `app/Http/Kernel.php`:

```php
protected $routeMiddleware = [
    // ... existing middleware
    'permission' => \App\Http\Middleware\CheckPermission::class,
];
```

#### Route Protection

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api;

Route::middleware('auth:api')->group(function () {
    // Crops - Protected by permission
    Route::get('crops', [Api\CropController::class, 'index'])
        ->middleware('permission:view_crops');
    
    Route::post('crops', [Api\CropController::class, 'store'])
        ->middleware('permission:create_crops');
    
    Route::put('crops/{id}', [Api\CropController::class, 'update'])
        ->middleware('permission:edit_crops');
    
    Route::delete('crops/{id}', [Api\CropController::class, 'destroy'])
        ->middleware('permission:delete_crops');

    // Livestock
    Route::get('livestock', [Api\LivestockController::class, 'index'])
        ->middleware('permission:view_livestock');
    
    Route::post('livestock', [Api\LivestockController::class, 'store'])
        ->middleware('permission:create_livestock');
});
```

### Practical Examples

#### Check Multiple Permissions (Any)

```php
// User has at least one permission
if (auth()->user()->hasAnyPermission(['create_crops', 'create_livestock'])) {
    // Show create menu
}
```

#### Check Multiple Permissions (All)

```php
// User has all permissions
if (auth()->user()->hasAllPermissions(['view_farms', 'view_crops', 'view_livestock'])) {
    // Show dashboard
}
```

#### Check Role

```php
// Check if user has specific role
if (auth()->user()->hasRole('admin')) {
    // Show admin panel
}

// Check multiple roles
if (auth()->user()->hasAnyRole(['owner', 'admin'])) {
    // Show management options
}
```

#### Assign/Revoke Permissions

```php
// Assign permission to user
$user->givePermissionTo('create_crops');

// Revoke permission from user
$user->revokePermissionTo('create_crops');

// Sync permissions (replace all)
$user->syncPermissions(['view_crops', 'create_crops']);

// Assign role to user
$user->assignRole('farmer');

// Revoke role from user
$user->removeRole('farmer');

// Sync roles (replace all)
$user->syncRoles(['farmer', 'worker']);
```

### Database Queries

```php
// Get all permissions for user (direct + via roles)
$permissions = auth()->user()->getAllPermissions();

// Get all roles for user
$roles = auth()->user()->getRoleNames();

// Get all users with a specific role
$farmers = User::role('farmer')->get();

// Get all users with a specific permission
$canCreateCrops = User::permission('create_crops')->get();

// Check if role has permission
$adminRole = Role::findByName('admin');
if ($adminRole->hasPermissionTo('delete_farms')) {
    // Admin can delete farms
}
```

### Caching & Performance

```php
// Clear cache after role/permission changes
auth()->user()->load('roles', 'permissions');

// Or clear entire cache
app()['cache']->forget('spatie.permission.cache');

// In config/permission.php, you can configure cache lifetime
'cache' => [
    'expiration_time' => 86400, // 24 hours
    'key' => 'spatie.permission.cache',
],
```

---

## API ENDPOINTS

### Authentication (Public)
```
POST   /api/v1/auth/register-company     Create company & user
POST   /api/v1/auth/login                Login user
POST   /api/v1/auth/forgot-password      Request password reset
POST   /api/v1/auth/reset-password       Reset password with code
```

### Authentication (Protected)
```
GET    /api/v1/auth/me                   Get current user
POST   /api/v1/auth/logout               Logout user
POST   /api/v1/auth/refresh-token        Refresh JWT token
POST   /api/v1/auth/change-password      Change user password
```

### Users (Protected)
```
GET    /api/v1/users/{id}                Get user profile
PUT    /api/v1/users/{id}                Update user
POST   /api/v1/users/{id}/avatar         Upload avatar
GET    /api/v1/users                     List users (admin)
DELETE /api/v1/users/{id}                Delete user (soft)
GET    /api/v1/users/{id}/preferences    Get preferences
PUT    /api/v1/users/{id}/preferences    Update preferences
```

### Farms (Protected)
```
GET    /api/v1/farms                     List user's farms
POST   /api/v1/farms                     Create farm
GET    /api/v1/farms/{id}                Get farm details
PUT    /api/v1/farms/{id}                Update farm
DELETE /api/v1/farms/{id}                Delete farm
GET    /api/v1/farms/{id}/summary        Farm summary
GET    /api/v1/farms/{id}/stats          Farm statistics
```

### Fields (Protected)
```
GET    /api/v1/fields?farm_id={id}       List fields
POST   /api/v1/fields                    Create field
GET    /api/v1/fields/{id}               Get field
PUT    /api/v1/fields/{id}               Update field
DELETE /api/v1/fields/{id}               Delete field
GET    /api/v1/fields/{id}/map           Get map data
```

### Crops (Protected)
```
GET    /api/v1/crops?farm_id={id}        List crops
POST   /api/v1/crops                     Create crop
GET    /api/v1/crops/{id}                Get crop
PUT    /api/v1/crops/{id}                Update crop
DELETE /api/v1/crops/{id}                Delete crop
POST   /api/v1/crops/{id}/health         Log health
GET    /api/v1/crops/{id}/health         Get health history
POST   /api/v1/crops/{id}/harvest        Record harvest
```

### Livestock (Protected)
```
GET    /api/v1/livestock?farm_id={id}    List livestock
POST   /api/v1/livestock                 Create livestock
GET    /api/v1/livestock/{id}            Get livestock
PUT    /api/v1/livestock/{id}            Update livestock
PATCH  /api/v1/livestock/{id}/status     Change status
POST   /api/v1/livestock/{id}/health     Log health
GET    /api/v1/livestock/{id}/health     Get health history
POST   /api/v1/livestock/{id}/breeding   Record breeding
GET    /api/v1/livestock/types           Get types (cached)
```

### Sheds (Protected)
```
GET    /api/v1/sheds?farm_id={id}        List sheds
POST   /api/v1/sheds                     Create shed
GET    /api/v1/sheds/{id}                Get shed
PUT    /api/v1/sheds/{id}                Update shed
DELETE /api/v1/sheds/{id}                Delete shed
GET    /api/v1/sheds/{id}/occupancy      Get occupancy
```

### Workers (Protected)
```
GET    /api/v1/workers?farm_id={id}      List workers
POST   /api/v1/workers                   Create worker
GET    /api/v1/workers/{id}              Get worker
PUT    /api/v1/workers/{id}              Update worker
DELETE /api/v1/workers/{id}              Delete worker
GET    /api/v1/workers/{id}/schedules    Get schedules
POST   /api/v1/workers/{id}/schedules    Create schedule
GET    /api/v1/workers/{id}/attendance   Get attendance
POST   /api/v1/workers/{id}/attendance/check-in   Check in
POST   /api/v1/workers/{id}/attendance/check-out  Check out
GET    /api/v1/workers/{id}/attendance/summary    Summary
```

### Inventory (Protected)
```
GET    /api/v1/inventory?farm_id={id}    List items
POST   /api/v1/inventory                 Create item
GET    /api/v1/inventory/{id}            Get item
PUT    /api/v1/inventory/{id}            Update item
DELETE /api/v1/inventory/{id}            Delete item
POST   /api/v1/inventory/{id}/usage      Log usage
GET    /api/v1/inventory/{id}/usage      Get usage history
GET    /api/v1/inventory/alerts/low-stock  Low stock items
GET    /api/v1/inventory/alerts/expired    Expired items
```

### Suppliers (Protected)
```
GET    /api/v1/suppliers                 List suppliers
POST   /api/v1/suppliers                 Create supplier
GET    /api/v1/suppliers/{id}            Get supplier
PUT    /api/v1/suppliers/{id}            Update supplier
DELETE /api/v1/suppliers/{id}            Delete supplier
```

### Finances (Protected)
```
GET    /api/v1/finances/summary          Get summary
POST   /api/v1/finances/income           Log income
POST   /api/v1/finances/expense          Log expense
GET    /api/v1/finances/income           Get income records
GET    /api/v1/finances/expense          Get expense records
GET    /api/v1/finances/reports          Get reports
```

### Dashboard (Protected)
```
GET    /api/v1/dashboard/stats           Dashboard stats
GET    /api/v1/dashboard/overview        Overview
GET    /api/v1/dashboard/activity        Recent activity
GET    /api/v1/dashboard/alerts          Farm alerts
```

### Analytics (Protected)
```
GET    /api/v1/analytics/crops/status    Crop status
GET    /api/v1/analytics/crops/yield     Crop yield
GET    /api/v1/analytics/livestock/health   Livestock health
GET    /api/v1/analytics/livestock/types    By type
GET    /api/v1/analytics/inventory/status   Inventory status
GET    /api/v1/analytics/charts/crop-timeline    Timeline
GET    /api/v1/analytics/charts/productivity    Productivity
```

### Notifications (Protected)
```
GET    /api/v1/notifications             Get notifications
POST   /api/v1/notifications/{id}/read   Mark as read
DELETE /api/v1/notifications/{id}        Delete notification
GET    /api/v1/notifications/settings    Get settings
PUT    /api/v1/notifications/settings    Update settings
```

---

## PHASE-BY-PHASE TASKS

### PHASE 1: WEEKS 1-4 (Foundation)

**Week 1: Setup & Database**

Task 1.1: Project Setup (6 hours)
- Create Laravel project: `composer create-project laravel/laravel farm-glow-dashboard`
- Install: `composer require tymon/jwt-auth laravel/sanctum`
- Configure .env with database credentials
- Create database: `CREATE DATABASE farm_glow;`
- Setup JWT: `php artisan jwt:secret`
- Create app/Http/Middleware/CompanyContext.php (extract company_id from token)
- Create app/Traits/ApiResponse.php (standardized JSON responses)

Task 1.2: Migrations (8 hours)
- Run: `php artisan make:migration create_companies_table`
- Create all 20 migration files (see Database Schema above)
- Run: `php artisan migrate`
- Verify all tables created with proper indexes

Task 1.3: Models (10 hours)
- Create app/Models/Company.php with relationships
- Create app/Models/User.php with company_id
- Create app/Models/Farm.php with scopes: byCompany(), byUser()
- Create app/Models/Crop.php with scopes: byCompany(), byFarm(), byStatus()
- Create app/Models/Livestock.php
- Create app/Models/Worker.php
- Create app/Models/Inventory.php
- Create app/Models/Finance.php
- Create app/Models/Notification.php
- All models use: SoftDeletes trait
- Add query scopes for multi-tenancy filtering

**Week 2: Authentication**

Task 2.1: JWT Authentication (10 hours)
- Create app/Http/Controllers/Api/AuthController.php
- Implement: register, login, logout, refresh, me endpoints
- Create app/Http/Requests/RegisterRequest.php with validation
- Create app/Http/Requests/LoginRequest.php with validation
- Create app/Services/AuthService.php for business logic
- Generate JWT token with company_id in payload
- Add password reset flow: forgot-password, reset-password
- Test all endpoints with Postman/curl

Task 2.2: RBAC System (8 hours)
- Create app/Policies/CropPolicy.php (view, create, update, delete)
- Create app/Policies/LivestockPolicy.php
- Create app/Policies/FarmPolicy.php
- Register policies in AuthServiceProvider
- Create app/Http/Middleware/CheckRole.php
- Add helper methods on User: isFarmer(), isAdmin(), isOwner()
- Test authorization on protected endpoints

**Week 3: User & Farm Management**

Task 3.1: User APIs (10 hours)
- Create app/Http/Controllers/Api/UserController.php
- Implement: show, update, index (admin), destroy endpoints
- Create app/Http/Requests/UpdateUserRequest.php
- Create app/Http/Resources/UserResource.php
- Create app/Services/UserService.php
- Implement avatar upload to storage/app/avatars/
- Add routes to routes/api.php
- Test user endpoints

Task 3.2: Farm APIs (8 hours)
- Create app/Http/Controllers/Api/FarmController.php
- Implement: index, store, show, update, destroy endpoints
- Create app/Http/Requests/StoreFarmRequest.php
- Create app/Http/Resources/FarmResource.php
- Create app/Services/FarmService.php
- Add farm summary & stats endpoints
- All queries auto-filter by company_id
- Test farm endpoints

**Week 4: Crop Management**

Task 4.1: Crop & Field APIs (15 hours)
- Create app/Http/Controllers/Api/CropController.php
- Create app/Http/Controllers/Api/FieldController.php
- Implement full CRUD for crops and fields
- Create app/Http/Requests/StoreCropRequest.php
- Create app/Services/CropService.php
- Implement: logHealth, recordHarvest endpoints
- Create app/Models/CropHealthRecord.php
- Add health history retrieval
- All queries filter by company_id + farm_id
- Test crop endpoints

**Verification for Phase 1:**
```bash
php artisan test                    # All tests pass
php artisan migrate:refresh --seed  # Database resets cleanly
curl http://localhost:8006/api/v1/auth/login  # Can login
```

---

### PHASE 2: WEEKS 5-8 (Core Features Part 1)

**Week 5-6: Livestock Management**

Task 5.1: Livestock APIs (15 hours)
- Create app/Http/Controllers/Api/LivestockController.php
- Create app/Http/Controllers/Api/ShedController.php
- Implement full CRUD for livestock and sheds
- Create app/Services/LivestockService.php
- Implement: logHealth, recordBreeding endpoints
- Implement occupancy tracking in sheds
- Create app/Models/LivestockHealthRecord.php
- Create app/Models/BreedingRecord.php
- Test livestock endpoints

**Week 6-7: Dashboard & Analytics**

Task 6.1: Dashboard APIs (12 hours)
- Create app/Http/Controllers/Api/DashboardController.php
- Implement: stats, overview, activity, alerts endpoints
- Create app/Services/DashboardService.php
- Implement database queries for:
  - Total counts (crops, livestock, workers)
  - Health status distribution
  - Ready for harvest items
  - Low stock items
- Cache dashboard stats for 5 minutes: `Cache::remember('dashboard_stats', 300, ...)`
- Test dashboard endpoints

Task 6.2: Analytics APIs (12 hours)
- Create app/Http/Controllers/Api/CropAnalyticsController.php
- Create app/Http/Controllers/Api/LivestockAnalyticsController.php
- Implement: status, yield, health, types endpoints
- Create app/Services/AnalyticsService.php
- Use database aggregation (SUM, COUNT, AVG)
- Return time-series data for charts
- Cache analytics for 1 hour
- Test analytics endpoints

**Week 7-8: Worker Management**

Task 7.1: Worker APIs (12 hours)
- Create app/Http/Controllers/Api/WorkerController.php
- Implement full CRUD for workers
- Create app/Services/WorkerService.php
- Implement work schedules: create, update, complete, cancel
- Implement attendance: check-in, check-out, history, summary
- Create app/Models/WorkSchedule.php
- Create app/Models/Attendance.php
- Calculate hours_worked on check-out
- Test worker endpoints

---

### PHASE 3: WEEKS 9-12 (Core Features Part 2)

**Week 9-10: Inventory Management**

Task 8.1: Inventory APIs (12 hours)
- Create app/Http/Controllers/Api/InventoryController.php
- Create app/Http/Controllers/Api/SupplierController.php
- Implement full CRUD for inventory and suppliers
- Create app/Services/InventoryService.php
- Implement usage tracking & history
- Implement low-stock & expiry alerts
- Calculate inventory value
- Create app/Models/InventoryUsage.php
- Test inventory endpoints

**Week 11: Financial Management & Notifications**

Task 9.1: Finance APIs (8 hours)
- Create app/Http/Controllers/Api/FinanceController.php
- Implement: income, expense, summary, reports endpoints
- Create app/Services/FinanceService.php
- Calculate financial summaries by date range
- Group by category
- Test finance endpoints

Task 9.2: Notifications (8 hours)
- Create app/Http/Controllers/Api/NotificationController.php
- Implement: list, markAsRead, delete, settings endpoints
- Create app/Services/NotificationService.php
- Implement event-based notifications (triggered by actions)
- Create app/Events/CropHealthAlert.php
- Create app/Events/LowStockAlert.php
- Use Laravel queue for notifications
- Test notification endpoints

**Week 12: Advanced Features**

Task 10.1: Reports & Weather (12 hours)
- Create app/Http/Controllers/Api/ReportController.php
- Implement: generate, download, schedule endpoints
- Create app/Services/ReportService.php
- Generate PDF/CSV exports using Laravel Excel
- Implement scheduled reports via Laravel scheduler
- Create app/Http/Controllers/Api/WeatherController.php
- Integrate OpenWeatherMap API
- Cache weather for 30 minutes
- Test report & weather endpoints

---

### PHASE 4: WEEKS 13-14 (Optimization)

Task 11.1: Performance (12 hours)
- Add indexes on frequently queried columns
- Implement eager loading to prevent N+1 queries
- Add pagination to all list endpoints (limit: 20, max: 100)
- Cache database queries: `Cache::remember('crops', 300, fn() => ...)`
- Use query scopes consistently
- Enable query logging: `DB::enableQueryLog()`
- Monitor query performance
- Optimize slow queries

Task 11.2: Caching (12 hours)
- Configure Redis: `CACHE_DRIVER=redis` in .env
- Cache dashboard stats: 5 min
- Cache analytics data: 1 hour
- Cache livestock types: 24 hours
- Implement cache invalidation on create/update/delete
- Add admin endpoint to flush caches
- Test caching with redis-cli

---

### PHASE 5: WEEKS 15-16 (Testing & Deployment)

Task 12.1: Testing (16 hours)
- Create tests/Feature/AuthTest.php
- Create tests/Feature/CropTest.php
- Create tests/Feature/LivestockTest.php
- Create tests/Feature/WorkerTest.php
- Create tests/Feature/InventoryTest.php
- Create database factories for all models
- Test CRUD operations
- Test company isolation (user A cannot access user B's data)
- Test authorization (worker cannot delete crop)
- Test validation errors
- Run: `php artisan test --coverage` (target 80%+)

Task 12.2: Deployment (8 hours)
- Create .env.production
- Setup CI/CD pipeline (GitHub Actions)
- Create Dockerfile & docker-compose.yml
- Configure nginx
- Setup SSL certificate
- Database backup strategy
- Monitoring setup
- Deploy to server
- Smoke tests in production

---

## CODE TEMPLATES

### 1. Eloquent Model Template

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Crop extends Model
{
    use SoftDeletes;

    protected $keyType = 'int';
    public $incrementing = true;

    protected $fillable = [
        'company_id', 'farm_id', 'field_id', 'name', 'variety',
        'planting_date', 'expected_harvest_date', 'actual_harvest_date',
        'quantity_planted', 'yield', 'status', 'notes'
    ];

    protected $casts = [
        'planting_date' => 'date',
        'expected_harvest_date' => 'date',
        'actual_harvest_date' => 'date',
        'quantity_planted' => 'decimal:2',
        'yield' => 'decimal:2',
    ];

    // ✅ Multi-tenant relationships
    public function company() { return $this->belongsTo(Company::class); }
    public function farm() { return $this->belongsTo(Farm::class); }
    public function field() { return $this->belongsTo(Field::class); }
    public function healthRecords() { return $this->hasMany(CropHealthRecord::class); }

    // ✅ Query scopes for filtering
    public function scopeByCompany($query, $companyId) {
        return $query->where('company_id', $companyId);
    }

    public function scopeByFarm($query, $farmId) {
        return $query->where('farm_id', $farmId);
    }

    public function scopeByStatus($query, $status) {
        return $query->where('status', $status);
    }

    // ✅ Custom business logic
    public function isReadyForHarvest(): bool {
        return $this->status === 'growing' && now()->greaterThanOrEqualTo($this->expected_harvest_date);
    }

    public function recordHarvest($harvestDate, $yield) {
        $this->update([
            'actual_harvest_date' => $harvestDate,
            'yield' => $yield,
            'status' => 'harvested',
        ]);
    }

    public function logHealth($status, $treatment = null, $notes = null) {
        return $this->healthRecords()->create([
            'company_id' => $this->company_id,
            'record_date' => now()->date(),
            'health_status' => $status,
            'treatment' => $treatment,
            'notes' => $notes,
        ]);
    }
}
```

---

### 2. Service Class Template

```php
<?php

namespace App\Services;

use App\Models\Crop;
use App\Models\Farm;

class CropService
{
    // ✅ Always include companyId parameter
    public function createCrop(int $companyId, array $data): Crop
    {
        // Verify farm belongs to company
        $farm = Farm::where('id', $data['farm_id'])
            ->where('company_id', $companyId)
            ->firstOrFail();

        return Crop::create(array_merge($data, [
            'company_id' => $companyId,
            'status' => 'planning',
        ]));
    }

    // ✅ All queries include company_id filter
    public function getCropsByFarm(int $farmId, int $companyId, int $perPage = 20)
    {
        return Crop::byCompany($companyId)
            ->byFarm($farmId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    // ✅ Verify ownership before update
    public function updateCrop(int $cropId, array $data, int $companyId): Crop
    {
        $crop = Crop::where('id', $cropId)
            ->where('company_id', $companyId)
            ->firstOrFail();

        $crop->update($data);
        return $crop;
    }

    // ✅ Verify ownership before delete
    public function deleteCrop(int $cropId, int $companyId): bool
    {
        $crop = Crop::where('id', $cropId)
            ->where('company_id', $companyId)
            ->firstOrFail();

        return $crop->delete();
    }

    public function recordHarvest(int $cropId, array $data, int $companyId): Crop
    {
        $crop = Crop::where('id', $cropId)
            ->where('company_id', $companyId)
            ->firstOrFail();

        $crop->recordHarvest($data['actual_harvest_date'], $data['yield']);
        return $crop;
    }

    public function logHealth(int $cropId, array $data, int $companyId)
    {
        $crop = Crop::where('id', $cropId)
            ->where('company_id', $companyId)
            ->firstOrFail();

        return $crop->logHealth(
            $data['health_status'],
            $data['treatment'] ?? null,
            $data['notes'] ?? null
        );
    }
}
```

---

### 3. Controller Template

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCropRequest;
use App\Http\Requests\UpdateCropRequest;
use App\Http\Resources\CropResource;
use App\Services\CropService;

class CropController extends Controller
{
    public function __construct(private CropService $cropService) {}

    // ✅ Extract company_id from authenticated user
    public function index()
    {
        $companyId = auth()->user()->company_id;
        $farmId = request('farm_id');

        $crops = $this->cropService->getCropsByFarm($farmId, $companyId);

        return CropResource::collection($crops);
    }

    public function store(StoreCropRequest $request)
    {
        $companyId = auth()->user()->company_id;
        $crop = $this->cropService->createCrop($companyId, $request->validated());

        return new CropResource($crop);
    }

    public function show(int $id)
    {
        $companyId = auth()->user()->company_id;
        $crop = Crop::where('id', $id)
            ->where('company_id', $companyId)
            ->firstOrFail();

        return new CropResource($crop);
    }

    public function update(UpdateCropRequest $request, int $id)
    {
        $companyId = auth()->user()->company_id;
        $crop = $this->cropService->updateCrop($id, $request->validated(), $companyId);

        return new CropResource($crop);
    }

    public function destroy(int $id)
    {
        $companyId = auth()->user()->company_id;
        $this->cropService->deleteCrop($id, $companyId);

        return response()->json(['message' => 'Crop deleted successfully']);
    }

    public function recordHarvest(int $id)
    {
        $companyId = auth()->user()->company_id;
        $crop = $this->cropService->recordHarvest($id, request()->all(), $companyId);

        return new CropResource($crop);
    }

    public function logHealth(int $id)
    {
        $companyId = auth()->user()->company_id;
        $health = $this->cropService->logHealth($id, request()->all(), $companyId);

        return response()->json($health);
    }
}
```

---

### 4. FormRequest Template

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCropRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'farm_id' => 'required|integer|exists:farms,id',
            'field_id' => 'nullable|integer|exists:fields,id',
            'name' => 'required|string|max:255',
            'variety' => 'nullable|string|max:255',
            'planting_date' => 'required|date|before:expected_harvest_date',
            'expected_harvest_date' => 'required|date|after:planting_date',
            'quantity_planted' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    // ✅ Auto-add company_id to validated data
    public function validated(): array
    {
        return array_merge(parent::validated(), [
            'company_id' => auth()->user()->company_id,
        ]);
    }
}
```

---

### 5. Resource Template

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class CropResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'farm_id' => $this->farm_id,
            'name' => $this->name,
            'variety' => $this->variety,
            'planting_date' => $this->planting_date?->format('Y-m-d'),
            'expected_harvest_date' => $this->expected_harvest_date?->format('Y-m-d'),
            'actual_harvest_date' => $this->actual_harvest_date?->format('Y-m-d'),
            'quantity_planted' => (float) $this->quantity_planted,
            'yield' => $this->yield ? (float) $this->yield : null,
            'status' => $this->status,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
```

---

### 6. Routes Template (routes/api.php)

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api;

Route::prefix('v1')->group(function () {
    // Public auth
    Route::post('auth/register-company', [Api\AuthController::class, 'registerCompany']);
    Route::post('auth/login', [Api\AuthController::class, 'login']);
    Route::post('auth/forgot-password', [Api\AuthController::class, 'forgotPassword']);
    Route::post('auth/reset-password', [Api\AuthController::class, 'resetPassword']);

    // Protected routes
    Route::middleware('auth:api')->group(function () {
        // Auth
        Route::post('auth/logout', [Api\AuthController::class, 'logout']);
        Route::get('auth/me', [Api\AuthController::class, 'me']);
        Route::post('auth/refresh-token', [Api\AuthController::class, 'refresh']);
        Route::post('auth/change-password', [Api\AuthController::class, 'changePassword']);

        // Users
        Route::apiResource('users', Api\UserController::class);
        Route::post('users/{id}/avatar', [Api\UserController::class, 'uploadAvatar']);
        Route::get('users/{id}/preferences', [Api\UserController::class, 'getPreferences']);
        Route::put('users/{id}/preferences', [Api\UserController::class, 'updatePreferences']);

        // Farms
        Route::apiResource('farms', Api\FarmController::class);
        Route::get('farms/{id}/summary', [Api\FarmController::class, 'summary']);
        Route::get('farms/{id}/stats', [Api\FarmController::class, 'stats']);

        // Fields
        Route::apiResource('fields', Api\FieldController::class);
        Route::get('fields/{id}/map', [Api\FieldController::class, 'map']);

        // Crops
        Route::apiResource('crops', Api\CropController::class);
        Route::post('crops/{id}/health', [Api\CropController::class, 'logHealth']);
        Route::get('crops/{id}/health', [Api\CropController::class, 'healthHistory']);
        Route::post('crops/{id}/harvest', [Api\CropController::class, 'recordHarvest']);

        // Livestock
        Route::apiResource('livestock', Api\LivestockController::class);
        Route::post('livestock/{id}/health', [Api\LivestockController::class, 'logHealth']);
        Route::get('livestock/{id}/health', [Api\LivestockController::class, 'healthHistory']);
        Route::post('livestock/{id}/breeding', [Api\LivestockController::class, 'recordBreeding']);
        Route::patch('livestock/{id}/status', [Api\LivestockController::class, 'changeStatus']);
        Route::get('livestock/types', [Api\LivestockController::class, 'types']);

        // Sheds
        Route::apiResource('sheds', Api\ShedController::class);
        Route::get('sheds/{id}/occupancy', [Api\ShedController::class, 'occupancy']);

        // Workers
        Route::apiResource('workers', Api\WorkerController::class);
        Route::get('workers/{id}/schedules', [Api\WorkerController::class, 'getSchedules']);
        Route::post('workers/{id}/schedules', [Api\WorkerController::class, 'createSchedule']);
        Route::get('workers/{id}/attendance', [Api\WorkerController::class, 'getAttendance']);
        Route::post('workers/{id}/attendance/check-in', [Api\WorkerController::class, 'checkIn']);
        Route::post('workers/{id}/attendance/check-out', [Api\WorkerController::class, 'checkOut']);
        Route::get('workers/{id}/attendance/summary', [Api\WorkerController::class, 'attendanceSummary']);

        // Inventory
        Route::apiResource('inventory', Api\InventoryController::class);
        Route::post('inventory/{id}/usage', [Api\InventoryController::class, 'logUsage']);
        Route::get('inventory/{id}/usage', [Api\InventoryController::class, 'usageHistory']);
        Route::get('inventory/alerts/low-stock', [Api\InventoryController::class, 'lowStockAlerts']);
        Route::get('inventory/alerts/expired', [Api\InventoryController::class, 'expiredAlerts']);

        // Suppliers
        Route::apiResource('suppliers', Api\SupplierController::class);

        // Finances
        Route::get('finances/summary', [Api\FinanceController::class, 'summary']);
        Route::post('finances/income', [Api\FinanceController::class, 'logIncome']);
        Route::post('finances/expense', [Api\FinanceController::class, 'logExpense']);
        Route::get('finances/income', [Api\FinanceController::class, 'getIncome']);
        Route::get('finances/expense', [Api\FinanceController::class, 'getExpense']);
        Route::get('finances/reports', [Api\FinanceController::class, 'reports']);

        // Dashboard
        Route::get('dashboard/stats', [Api\DashboardController::class, 'stats']);
        Route::get('dashboard/overview', [Api\DashboardController::class, 'overview']);
        Route::get('dashboard/activity', [Api\DashboardController::class, 'activity']);
        Route::get('dashboard/alerts', [Api\DashboardController::class, 'alerts']);

        // Analytics
        Route::prefix('analytics')->group(function () {
            Route::get('crops/status', [Api\CropAnalyticsController::class, 'status']);
            Route::get('crops/yield', [Api\CropAnalyticsController::class, 'yield']);
            Route::get('livestock/health', [Api\LivestockAnalyticsController::class, 'health']);
            Route::get('livestock/types', [Api\LivestockAnalyticsController::class, 'types']);
            Route::get('inventory/status', [Api\InventoryAnalyticsController::class, 'status']);
            Route::get('charts/crop-timeline', [Api\ChartController::class, 'cropTimeline']);
            Route::get('charts/productivity', [Api\ChartController::class, 'productivity']);
        });

        // Notifications
        Route::get('notifications', [Api\NotificationController::class, 'index']);
        Route::post('notifications/{id}/read', [Api\NotificationController::class, 'markAsRead']);
        Route::delete('notifications/{id}', [Api\NotificationController::class, 'destroy']);
        Route::get('notifications/settings', [Api\NotificationController::class, 'getSettings']);
        Route::put('notifications/settings', [Api\NotificationController::class, 'updateSettings']);

        // Reports
        Route::post('reports/generate', [Api\ReportController::class, 'generate']);
        Route::get('reports/{id}/download', [Api\ReportController::class, 'download']);
        Route::get('reports/schedule', [Api\ReportController::class, 'schedules']);
        Route::post('reports/schedule', [Api\ReportController::class, 'scheduleReport']);

        // Weather
        Route::get('weather', [Api\WeatherController::class, 'current']);
        Route::get('weather/forecast', [Api\WeatherController::class, 'forecast']);
        Route::get('weather/alerts', [Api\WeatherController::class, 'alerts']);
    });
});
```

---

### 7. Factory Template

```php
<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Farm;
use Illuminate\Database\Eloquent\Factories\Factory;

class CropFactory extends Factory
{
    public function definition(): array
    {
        $plantingDate = $this->faker->dateTimeBetween('-3 months');
        
        return [
            'company_id' => Company::factory(),
            'farm_id' => Farm::factory(),
            'field_id' => null,
            'name' => $this->faker->word(),
            'variety' => $this->faker->word(),
            'planting_date' => $plantingDate,
            'expected_harvest_date' => $this->faker->dateTimeBetween($plantingDate, '+3 months'),
            'actual_harvest_date' => null,
            'quantity_planted' => $this->faker->numberBetween(100, 1000),
            'yield' => null,
            'status' => 'growing',
            'notes' => $this->faker->text(),
        ];
    }
}
```

---

## TESTING GUIDE

### Basic Test Template

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Company;
use App\Models\User;
use App\Models\Farm;
use App\Models\Crop;

class CropApiTest extends TestCase
{
    protected Company $company;
    protected User $user;
    protected Farm $farm;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->company = Company::factory()->create();
        $this->user = User::factory()->create(['company_id' => $this->company->id]);
        $this->farm = Farm::factory()->create(['company_id' => $this->company->id]);
    }

    public function test_can_list_crops(): void
    {
        Crop::factory()->create(['company_id' => $this->company->id, 'farm_id' => $this->farm->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/crops?farm_id={$this->farm->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['data' => [['id', 'name', 'status']]])
            ->assertJsonCount(1, 'data');
    }

    public function test_cannot_access_other_company_crops(): void
    {
        $otherCompany = Company::factory()->create();
        $otherFarm = Farm::factory()->create(['company_id' => $otherCompany->id]);
        $otherCrop = Crop::factory()->create(['company_id' => $otherCompany->id, 'farm_id' => $otherFarm->id]);

        $response = $this->actingAs($this->user)
            ->getJson("/api/v1/crops/{$otherCrop->id}");

        $response->assertStatus(404);
    }

    public function test_can_create_crop(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/v1/crops', [
                'farm_id' => $this->farm->id,
                'name' => 'Corn',
                'planting_date' => '2026-04-01',
                'expected_harvest_date' => '2026-08-01',
                'quantity_planted' => 100,
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['data' => ['id', 'name', 'status']])
            ->assertJson(['data' => ['status' => 'planning']]);
    }

    public function test_can_record_harvest(): void
    {
        $crop = Crop::factory()->create(['company_id' => $this->company->id, 'farm_id' => $this->farm->id]);

        $response = $this->actingAs($this->user)
            ->postJson("/api/v1/crops/{$crop->id}/harvest", [
                'actual_harvest_date' => '2026-08-15',
                'yield' => 500,
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('crops', [
            'id' => $crop->id,
            'status' => 'harvested',
            'yield' => 500,
        ]);
    }
}
```

### Run Tests

```bash
php artisan test                           # Run all tests
php artisan test --coverage                # With coverage report
php artisan test tests/Feature/CropApiTest.php  # Single test file
php artisan test --filter test_can_list_crops   # Single test
```

---

## DEPLOYMENT

### Pre-Deployment Checklist

```
✓ All tests passing (php artisan test)
✓ Code coverage ≥ 80%
✓ No security vulnerabilities
✓ Database migrations tested
✓ Environment variables configured
✓ Cache keys validated
✓ API documentation complete
✓ Performance benchmarks met
```

### Deployment Steps

```bash
# 1. Production environment setup
cp .env.production .env
php artisan key:generate
php artisan jwt:secret

# 2. Install dependencies (production only)
composer install --no-dev --optimize-autoloader

# 3. Database setup
php artisan migrate --force
php artisan db:seed --force

# 4. Cache optimization
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 5. File permissions
chmod -R 755 storage
chmod -R 755 bootstrap/cache

# 6. Start queue worker (if using async jobs)
php artisan queue:work --daemon

# 7. Start server (using Nginx + PHP-FPM)
# Configure Nginx with site config pointing to public/

# 8. Monitor
php artisan horizon:work  # For monitoring
```

### Docker Deployment

#### 1. Dockerfile

```dockerfile
FROM php:8.3-fpm-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    mysql-client \
    redis \
    zip \
    unzip \
    bash

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg
RUN docker-php-ext-install -j$(nproc) \
    pdo \
    pdo_mysql \
    gd \
    bcmath \
    ctype \
    fileinfo \
    json \
    mbstring \
    tokenizer \
    xml \
    redis

# Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Copy application
COPY . /app

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Create necessary directories
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views
RUN chmod -R 775 storage bootstrap/cache

# Expose port
EXPOSE 8006

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8006/api/v1/health || exit 1

# Start PHP-FPM
CMD ["php-fpm"]
```

#### 2. docker-compose.yml

```yaml
version: '3.8'

services:
  # Laravel Application
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: farm_glow_app
    restart: unless-stopped
    working_dir: /app
    environment:
      APP_NAME: "Farm Glow Dashboard"
      APP_ENV: production
      APP_DEBUG: "false"
      APP_URL: http://localhost:8006
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: farm_glow
      DB_USERNAME: farm_glow_user
      DB_PASSWORD: farm_glow_secure_password_change_me
      CACHE_DRIVER: redis
      QUEUE_CONNECTION: redis
      REDIS_HOST: redis
      REDIS_PASSWORD: null
      REDIS_PORT: 6379
      JWT_ALGORITHM: HS256
      SANCTUM_STATEFUL_DOMAINS: localhost,127.0.0.1
    volumes:
      - ./:/app
      - /app/node_modules
      - app_storage:/app/storage
      - app_bootstrap:/app/bootstrap/cache
    ports:
      - "8006:8006"
    networks:
      - farm_glow_network
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    links:
      - mysql
      - redis

  # Nginx Web Server
  nginx:
    image: nginx:alpine
    container_name: farm_glow_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./:/app
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
      - ./storage/logs:/var/log/nginx
    networks:
      - farm_glow_network
    depends_on:
      - app
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # MySQL Database
  mysql:
    image: mysql:8.0
    container_name: farm_glow_mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: farm_glow
      MYSQL_ROOT_PASSWORD: root_secure_password_change_me
      MYSQL_USER: farm_glow_user
      MYSQL_PASSWORD: farm_glow_secure_password_change_me
      MYSQL_ALLOW_EMPTY_PASSWORD: "false"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    ports:
      - "3306:3306"
    networks:
      - farm_glow_network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot_secure_password_change_me"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: --default-authentication-plugin=mysql_native_password --max_connections=1000

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: farm_glow_redis
    restart: unless-stopped
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    networks:
      - farm_glow_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    command: redis-server --appendonly yes --requirepass ""

  # Queue Worker (Optional)
  queue:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: farm_glow_queue
    restart: unless-stopped
    working_dir: /app
    command: php artisan queue:work --sleep=3 --tries=3
    environment:
      APP_NAME: "Farm Glow Dashboard"
      APP_ENV: production
      APP_DEBUG: "false"
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: farm_glow
      DB_USERNAME: farm_glow_user
      DB_PASSWORD: farm_glow_secure_password_change_me
      CACHE_DRIVER: redis
      QUEUE_CONNECTION: redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./:/app
    networks:
      - farm_glow_network
    depends_on:
      - app
      - mysql
      - redis

  # Scheduler (Optional)
  scheduler:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: farm_glow_scheduler
    restart: unless-stopped
    working_dir: /app
    command: php artisan schedule:work
    environment:
      APP_NAME: "Farm Glow Dashboard"
      APP_ENV: production
      APP_DEBUG: "false"
      DB_CONNECTION: mysql
      DB_HOST: mysql
      DB_PORT: 3306
      DB_DATABASE: farm_glow
      DB_USERNAME: farm_glow_user
      DB_PASSWORD: farm_glow_secure_password_change_me
      CACHE_DRIVER: redis
      QUEUE_CONNECTION: redis
      REDIS_HOST: redis
      REDIS_PORT: 6379
    volumes:
      - ./:/app
    networks:
      - farm_glow_network
    depends_on:
      - app
      - mysql
      - redis

volumes:
  mysql_data:
    driver: local
  redis_data:
    driver: local
  app_storage:
    driver: local
  app_bootstrap:
    driver: local

networks:
  farm_glow_network:
    driver: bridge
```

#### 3. Nginx Configuration - docker/nginx/default.conf

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name localhost;
    root /app/public;

    client_max_body_size 20M;

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass app:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml 
               text/x-component text/x-cross-domain-policy;
}
```

#### 4. MySQL Init Script - docker/mysql/init.sql

```sql
-- Create indexes for better performance
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_farms_company_id ON farms(company_id);
CREATE INDEX idx_farms_user_id ON farms(user_id);

-- Set MySQL variables for production
SET GLOBAL max_connections = 1000;
SET GLOBAL wait_timeout = 28800;
SET GLOBAL interactive_timeout = 28800;
```

#### 5. .dockerignore

```
.git
.gitignore
.dockerignore
docker-compose*.yml
Dockerfile*
.DS_Store
.env
.env.local
node_modules
.vscode
.idea
*.log
storage/logs/*
bootstrap/cache/*
vendor/bin
```

#### 6. .env.docker

```env
APP_NAME="Farm Glow Dashboard"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=farm_glow
DB_USERNAME=farm_glow_user
DB_PASSWORD=farm_glow_secure_password_change_me

BROADCAST_DRIVER=log
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=cookie
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=log
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="noreply@farmglow.local"
MAIL_FROM_NAME="${APP_NAME}"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=

JWT_ALGORITHM=HS256
JWT_SECRET=your_jwt_secret_here

SANCTUM_STATEFUL_DOMAINS=localhost,127.0.0.1
```

### Docker Commands

#### Basic Operations

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f app
docker-compose logs -f nginx
docker-compose logs -f mysql
docker-compose logs -f redis

# View all running containers
docker-compose ps

# Stop specific service
docker-compose stop app
```

#### Database Operations

```bash
# Access MySQL shell
docker-compose exec mysql mysql -u farm_glow_user -pfarm_glow_secure_password_change_me farm_glow

# Run migrations
docker-compose exec app php artisan migrate

# Rollback migrations
docker-compose exec app php artisan migrate:rollback

# Fresh migration (dangerous - drops all tables)
docker-compose exec app php artisan migrate:fresh --seed

# Seed database
docker-compose exec app php artisan db:seed

# Backup database
docker-compose exec mysql mysqldump -u farm_glow_user -pfarm_glow_secure_password_change_me farm_glow > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u farm_glow_user -pfarm_glow_secure_password_change_me farm_glow < backup.sql
```

#### Laravel Commands

```bash
# Access Laravel container shell
docker-compose exec app bash

# Clear caches
docker-compose exec app php artisan cache:clear
docker-compose exec app php artisan config:clear
docker-compose exec app php artisan route:clear
docker-compose exec app php artisan view:clear

# Generate keys
docker-compose exec app php artisan key:generate
docker-compose exec app php artisan jwt:secret

# Tinker (Interactive shell)
docker-compose exec app php artisan tinker

# Run tests
docker-compose exec app php artisan test
docker-compose exec app php artisan test --coverage
```

#### Cache & Queue Operations

```bash
# Redis CLI
docker-compose exec redis redis-cli

# Monitor Redis
docker-compose exec redis redis-cli MONITOR

# Clear Redis cache
docker-compose exec redis redis-cli FLUSHALL

# Check queue jobs
docker-compose exec app php artisan queue:list

# Retry failed jobs
docker-compose exec app php artisan queue:retry
```

#### Build & Deployment

```bash
# Rebuild images (after Dockerfile changes)
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View image sizes
docker images | grep farm_glow

# Push to registry
docker tag farm_glow_app:latest yourregistry.com/farm_glow:latest
docker push yourregistry.com/farm_glow:latest
```

#### Health Checks

```bash
# Check API health
curl http://localhost:8006/api/v1/health

# Check MySQL
docker-compose exec mysql mysqladmin ping -u farm_glow_user -pfarm_glow_secure_password_change_me

# Check Redis
docker-compose exec redis redis-cli ping

# Check Nginx
curl -I http://localhost

# Docker compose validation
docker-compose config
```

### Post-Deployment

```bash
# Verify all services are healthy
docker-compose ps

# Check API health endpoint
curl http://localhost:8006/api/v1/health

# Monitor application logs
docker-compose logs -f app

# Monitor Nginx logs
docker-compose logs -f nginx

# Monitor MySQL
docker-compose exec mysql mysqladmin ping -u farm_glow_user -pfarm_glow_secure_password_change_me

# Access Laravel Tinker for debugging
docker-compose exec app php artisan tinker

# Run tests in container
docker-compose exec app php artisan test --coverage

# Check database connections
docker-compose exec mysql mysql -u farm_glow_user -pfarm_glow_secure_password_change_me farm_glow -e "SHOW PROCESSLIST;"

# Monitor Redis memory usage
docker-compose exec redis redis-cli INFO memory
```

### Production Deployment

#### Using Docker Swarm

```bash
# Initialize swarm (run on manager node)
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml farm_glow

# Check service status
docker service ls
docker service ps farm_glow_app

# Scale service
docker service scale farm_glow_app=3
```

#### Using Kubernetes

```bash
# Create namespace
kubectl create namespace farm-glow

# Apply secrets
kubectl create secret generic db-secret \
  --from-literal=DB_USERNAME=farm_glow_user \
  --from-literal=DB_PASSWORD=farm_glow_secure_password \
  -n farm-glow

# Deploy using kubectl
kubectl apply -f k8s/deployment.yml -n farm-glow

# Check deployment status
kubectl get pods -n farm-glow
kubectl describe pod <pod-name> -n farm-glow
```

#### SSL/TLS with Let's Encrypt

```bash
# Install Certbot
docker run --rm -it -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/certbot:/var/www/certbot \
  certbot/certbot certonly --webroot \
  -w /var/www/certbot \
  -d yourdomain.com \
  -d www.yourdomain.com

# Update nginx config with SSL
# Add to docker/nginx/default.conf:
# listen 443 ssl http2;
# ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

# Restart Nginx
docker-compose exec nginx nginx -s reload
```

---

## IMPORTANT PATTERNS

### ✅ ALWAYS DO THIS:

1. **Include company_id in all queries:**
   ```php
   Crop::where('company_id', $companyId)->get()
   ```

2. **Auto-add company_id to request:**
   ```php
   public function validated(): array {
       return array_merge(parent::validated(), [
           'company_id' => auth()->user()->company_id,
       ]);
   }
   ```

3. **Verify ownership before update/delete:**
   ```php
   Crop::where('id', $id)->where('company_id', $companyId)->firstOrFail();
   ```

4. **Use scopes for common filters:**
   ```php
   Crop::byCompany($companyId)->byFarm($farmId)->get()
   ```

5. **Cache expensive queries:**
   ```php
   Cache::remember("crops_$companyId", 300, fn() => Crop::byCompany($companyId)->get())
   ```

### ❌ NEVER DO THIS:

1. **Query without company_id filter:**
   ```php
   Crop::find($id)  // WRONG - returns crop from any company
   Crop::where('id', $id)->where('company_id', $companyId)->firstOrFail()  // RIGHT
   ```

2. **Trust user input for company_id:**
   ```php
   Crop::create($request->all())  // WRONG - user could set any company_id
   Crop::create(array_merge($request->validated(), ['company_id' => auth()->user()->company_id]))  // RIGHT
   ```

3. **Forget to verify ownership:**
   ```php
   $crop = Crop::find($id)->update($data);  // WRONG - no company check
   // Use service with ownership verification  // RIGHT
   ```

4. **Mix company data in responses:**
   ```php
   // Make sure Resource only returns current company's related data
   ```

---

## COMMON COMMANDS

```bash
# Create new controller
php artisan make:controller Api/CropController --api

# Create model with migration
php artisan make:model Crop -m

# Create FormRequest
php artisan make:request StoreCropRequest

# Create Resource
php artisan make:resource CropResource

# Create Service class
php artisan make:class Services/CropService

# Create Factory
php artisan make:factory CropFactory

# Create Seeder
php artisan make:seeder CompanySeeder

# Run migrations
php artisan migrate

# Rollback migrations
php artisan migrate:rollback

# Seed database
php artisan db:seed

# Run tests
php artisan test

# Generate API documentation
php artisan scribe:generate

# Clear all caches
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear
```

---

## SUMMARY

This single file contains everything needed to build the Farm Glow Dashboard backend with Laravel 12:

- **Database schema** (20 tables with company_id)
- **80+ API endpoints** fully specified
- **16-week implementation plan** broken into 5 phases
- **Code templates** for models, services, controllers, requests, resources
- **Testing guide** with examples
- **Deployment instructions** with Docker
- **Common patterns** and anti-patterns

Start with PHASE 1, follow the tasks week by week, use the templates, and run tests continuously.

Good luck building! 🚀
