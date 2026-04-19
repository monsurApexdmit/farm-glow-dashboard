# Livestock Module

## Overview
Comprehensive livestock management system for tracking animals, health records, breeding, and sheds with visual grid-based management.

## Database Tables
- `livestock` - Individual animal records with breed and type
- `livestock_types` - Classification of livestock (cattle, poultry, etc.)
- `livestock_sheds` - Physical structures housing livestock
- `livestock_health_records` - Health tracking per animal
- `livestock_breeding_records` - Breeding history and genealogy

## API Endpoints

### Livestock
```
GET    /api/v1/livestock?farm_id={id}  List livestock (filterable)
POST   /api/v1/livestock                Create livestock record
GET    /api/v1/livestock/{id}           Get livestock details
PUT    /api/v1/livestock/{id}           Update livestock
DELETE /api/v1/livestock/{id}           Delete livestock (soft)
GET    /api/v1/livestock/{id}/health    Get health history
POST   /api/v1/livestock/{id}/health    Log health record
GET    /api/v1/livestock/shed/{shed_id} List livestock in shed
```

### Livestock Sheds
```
GET    /api/v1/sheds?farm_id={id}       List sheds
POST   /api/v1/sheds                    Create shed
GET    /api/v1/sheds/{id}               Get shed details
PUT    /api/v1/sheds/{id}               Update shed
DELETE /api/v1/sheds/{id}               Delete shed (soft)
GET    /api/v1/sheds/{id}/grid          Get shed grid with animals
POST   /api/v1/sheds/{id}/clean         Record cleaning
GET    /api/v1/sheds/{id}/stats         Get shed statistics
```

### Breeding Records
```
GET    /api/v1/breeding?farm_id={id}    List breeding records
POST   /api/v1/breeding                 Create breeding record
GET    /api/v1/breeding/{id}            Get breeding details
PUT    /api/v1/breeding/{id}            Update breeding record
POST   /api/v1/breeding/{id}/birth      Record birth
DELETE /api/v1/breeding/{id}            Delete record
```

## Key Features
✅ Comprehensive livestock tracking with tag numbers
✅ Health monitoring with historical records
✅ Breeding management with genealogy tracking
✅ Visual grid-based shed management
✅ Shed capacity and occupancy tracking
✅ Temperature and humidity monitoring
✅ Animal type classification with icons and colors
✅ Soft deletes and audit trails
✅ Multi-tenant company isolation
✅ Role-based permission system

## Implementation Order
1. Create LivestockType and Livestock models
2. Create LivestockShed model
3. Create LivestockHealthRecord and LivestockBreedingRecord models
4. Create FormRequests
5. Create Controllers
6. Create Services
7. Create Resources
8. Create Policies
9. Add routes with middleware
10. Write comprehensive tests
