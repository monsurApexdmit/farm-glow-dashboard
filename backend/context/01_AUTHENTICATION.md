# Authentication Module

## Overview
JWT-based authentication system with role-based access control (RBAC) using Spatie Permission package.

## Database Tables
- `users` - User accounts with company_id for multi-tenancy
- `permissions` - Granular action permissions
- `roles` - Role definitions
- `role_has_permissions` - Permission assignments
- `model_has_roles` - User role assignments

## Models

### User Model
```php
<?php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasRoles;
    
    protected $fillable = [
        'company_id', 'email', 'password', 'first_name', 'last_name',
        'phone', 'avatar_url', 'role', 'is_active', 'created_by', 'deleted_by'
    ];

    protected $hidden = ['password'];
    protected $casts = ['is_active' => 'boolean'];
    
    // Relationships
    public function company() {
        return $this->belongsTo(Company::class);
    }

    public function createdBy() {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deletedBy() {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    // Scopes
    public function scopeByCompany($query, $companyId) {
        return $query->where('company_id', $companyId);
    }

    public function scopeActive($query) {
        return $query->where('is_active', true);
    }

    // Methods
    public function getFullName() {
        return "{$this->first_name} {$this->last_name}";
    }
}
```

## API Endpoints

### Public Endpoints
```
POST   /api/v1/auth/register-company    Create company & owner user
POST   /api/v1/auth/login               Login and get JWT token
POST   /api/v1/auth/forgot-password     Request password reset email
POST   /api/v1/auth/reset-password      Reset password with code
```

### Protected Endpoints
```
GET    /api/v1/auth/me                  Get current authenticated user
POST   /api/v1/auth/logout              Logout and invalidate token
POST   /api/v1/auth/refresh-token       Refresh JWT token
POST   /api/v1/auth/change-password     Change user password
```

## Key Features
✅ JWT token-based authentication  
✅ Company registration with owner user  
✅ Password hashing with Hash facade  
✅ Password reset via email  
✅ Role-based access control  
✅ Token refresh mechanism  
✅ Comprehensive error handling  
✅ Multi-tenant support  

## Implementation Order
1. Create User model with HasRoles trait
2. Create AuthService
3. Create FormRequests
4. Create AuthController
5. Create JwtMiddleware
6. Configure JWT in config files
7. Add routes
8. Test all endpoints
