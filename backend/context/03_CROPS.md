# Crops Module

## Overview
Crop lifecycle management system for tracking planting, health monitoring, and harvesting.

## Database Tables
- `crops` - Crop records with lifecycle status
- `crop_health_records` - Health tracking per crop

## API Endpoints

### Crops
```
GET    /api/v1/crops?farm_id={id}     List crops
POST   /api/v1/crops                   Create crop record
GET    /api/v1/crops/{id}              Get crop details
PUT    /api/v1/crops/{id}              Update crop
DELETE /api/v1/crops/{id}              Delete crop (soft)
POST   /api/v1/crops/{id}/health       Log health record
GET    /api/v1/crops/{id}/health       Get health history
POST   /api/v1/crops/{id}/harvest      Record harvest
GET    /api/v1/crops/{id}/yield        Get yield information
```

## Key Features
✅ Crop lifecycle management (planning → growing → harvested)
✅ Health tracking with historical records
✅ Harvest recording with yield tracking
✅ Multi-crop planning
✅ Soft deletes and audit trails
✅ Role-based permission system

## Implementation Order
1. Create Crop and CropHealthRecord models
2. Create FormRequests
3. Create Controllers
4. Create Services
5. Create Resources
6. Create Policies
7. Add routes with middleware
8. Write comprehensive tests
