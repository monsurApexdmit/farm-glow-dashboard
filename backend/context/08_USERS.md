# Users Module

## Overview
User management system for profile management, preferences, activity tracking, and user administration.

## Database Tables
- `users` - User accounts with authentication
- `user_preferences` - User customization settings
- `user_activity_logs` - User action tracking
- `user_invitations` - Invitation management
- `user_audit_trail` - Comprehensive audit logging

## API Endpoints

### User Profile
```
GET    /api/v1/users/me                       Get current user
PUT    /api/v1/users/me                       Update profile
POST   /api/v1/users/me/avatar                Upload avatar
GET    /api/v1/users/me/preferences           Get user preferences
PUT    /api/v1/users/me/preferences           Update preferences
POST   /api/v1/users/me/change-password       Change password
GET    /api/v1/users/me/activity              Get user activity
```

### User Management
```
GET    /api/v1/users                          List users
POST   /api/v1/users                          Create user
GET    /api/v1/users/{id}                     Get user details
PUT    /api/v1/users/{id}                     Update user
DELETE /api/v1/users/{id}                     Delete user (soft)
POST   /api/v1/users/{id}/toggle-active       Toggle user status
PUT    /api/v1/users/{id}/roles               Update user roles
GET    /api/v1/users/{id}/activity            Get user activity
GET    /api/v1/users/{id}/audit-trail         Get user audit trail
```

### Invitations
```
GET    /api/v1/invitations                    List invitations
POST   /api/v1/invitations                    Send invitation
GET    /api/v1/invitations/{token}            Get invitation details
POST   /api/v1/invitations/{token}/accept     Accept invitation
DELETE /api/v1/invitations/{id}               Delete invitation
GET    /api/v1/invitations/pending            Get pending invitations
```

## Key Features
✅ Comprehensive user profile management
✅ User preferences and settings
✅ Activity logging for audit purposes
✅ User invitation system with token expiration
✅ Role and permission management
✅ Avatar upload support
✅ User status management (active/inactive)
✅ Audit trail tracking
✅ Multi-language and timezone support
✅ Soft deletes and audit trails

## Implementation Order
1. Create User model with relationships
2. Create UserPreference, UserActivityLog, UserInvitation, and UserAuditTrail models
3. Create FormRequests
4. Create Controllers
5. Create Services
6. Create Resources
7. Create Policies
8. Add routes with middleware
9. Write comprehensive tests
