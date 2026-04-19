# Farms Module

## Overview
Farm management system for organizing multiple farms per company with fields, crops, and workers.

## Database Tables
- `farms` - Farm records with company & user relationship
- `fields` - Fields within each farm
- `crops` - Crops planted in fields

## Models

### Farm Model
- Multi-farm support per company
- Field management within farms
- Soft deletes for data recovery
- Audit trail (created_by, deleted_by)
- Role-based access control

### Field Model
- Fields within each farm
- Geographical coordinates for mapping
- Soil type tracking
- Area measurements

## API Endpoints

### Farms
```
GET    /api/v1/farms                 List user's farms
POST   /api/v1/farms                 Create farm
GET    /api/v1/farms/{id}            Get farm details
PUT    /api/v1/farms/{id}            Update farm
DELETE /api/v1/farms/{id}            Delete farm (soft)
GET    /api/v1/farms/{id}/summary    Get farm summary (crops, fields, workers)
GET    /api/v1/farms/{id}/stats      Get farm statistics
```

### Fields
```
GET    /api/v1/fields?farm_id={id}   List fields
POST   /api/v1/fields                Create field
GET    /api/v1/fields/{id}           Get field details
PUT    /api/v1/fields/{id}           Update field
DELETE /api/v1/fields/{id}           Delete field (soft)
GET    /api/v1/fields/{id}/map       Get field coordinates for mapping
```

## Key Features
✅ Multi-farm support per company
✅ Field management within farms
✅ Soft deletes for data recovery
✅ Audit trail (created_by, deleted_by)
✅ Role-based access control
✅ Comprehensive statistics
✅ Geographical coordinates for mapping

## Implementation Order
1. Create Farm & Field models
2. Create FormRequests
3. Create Controllers
4. Create Services
5. Create Resources
6. Create Policies
7. Add routes with middleware
8. Write comprehensive tests
