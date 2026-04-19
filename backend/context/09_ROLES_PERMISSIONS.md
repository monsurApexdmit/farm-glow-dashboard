# Roles & Permissions Module

## Overview
Complete reference for role-based access control (RBAC) using Spatie Laravel Permission package with 24 granular permissions and 4 pre-configured roles.

## Permissions Structure (24 Total)

### Farm Management (4)
- `view_farms` - View farm information
- `create_farms` - Create new farms
- `edit_farms` - Edit farm information
- `delete_farms` - Delete farms

### Crop Management (5)
- `view_crops` - View crop information
- `create_crops` - Create crop records
- `edit_crops` - Edit crop information
- `delete_crops` - Delete crop records
- `log_crop_health` - Log crop health records

### Livestock Management (6)
- `view_livestock` - View livestock records
- `create_livestock` - Create livestock records
- `edit_livestock` - Edit livestock information
- `delete_livestock` - Delete livestock records
- `log_livestock_health` - Log livestock health records
- `manage_livestock_breeding` - Manage breeding records

### Worker Management (7)
- `view_workers` - View worker information
- `manage_workers` - Create, edit, delete workers
- `view_worker_schedules` - View worker schedules
- `manage_worker_schedules` - Create and manage schedules
- `record_attendance` - Record worker attendance
- `view_attendance` - View attendance records
- `review_worker_performance` - Submit performance reviews

### Inventory Management (2)
- `view_inventory` - View inventory items
- `manage_inventory` - Create, edit, delete inventory items

### Financial Management (4)
- `view_finances` - View financial transactions and reports
- `manage_finances` - Create and manage transactions, invoices, budgets
- `manage_payroll` - Process payroll and manage payments
- `generate_reports` - Generate financial reports

### User Management (2)
- `view_users` - View user information
- `manage_users` - Create, edit, delete users and manage roles

## Roles Configuration

### Owner Role (24/24 permissions)
- Description: Full system access, company-level administration
- Capabilities: All features and functions

### Manager Role (20/24 permissions)
- Excluded: `manage_payroll`, `generate_reports`, `manage_users`
- Description: Farm operations management
- Capabilities: Farms, crops, livestock, workers (excluding payroll), inventory

### Farmer Role (15/24 permissions)
- Description: Field-level operations
- Capabilities: View farms, manage crops/livestock, basic HR, view inventory/finances

### Worker Role (3/24 permissions)
- Description: Limited view-only access
- Capabilities: View farms, inventory, and financial information only

## Key Features
✅ 24 granular permissions organized by feature
✅ 4 pre-configured roles with clear hierarchies
✅ Cache-based permission checking for performance
✅ Database-driven role and permission management
✅ Flexible direct user permissions support
✅ Route middleware protection
✅ FormRequest authorization
✅ Policy-based authorization
✅ Comprehensive testing support
✅ Easy permission administration

## Implementation Order
1. Install Spatie Permission package
2. Publish configuration and migrations
3. Run database migrations
4. Create PermissionSeeder
5. Run seeders to populate permissions and roles
6. Configure middleware in routes
7. Add permission checks in FormRequests
8. Create authorization Policies
9. Test all permission scenarios
10. Document required permissions for each endpoint
