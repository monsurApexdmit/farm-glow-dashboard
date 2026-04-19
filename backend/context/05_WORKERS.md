# Workers Module

## Overview
Worker management system for tracking staff, schedules, attendance, payroll, and performance metrics.

## Database Tables
- `workers` - Worker records with role and status
- `worker_schedules` - Work schedules and shifts
- `worker_attendance` - Daily attendance tracking
- `worker_performance` - Performance ratings and reviews
- `worker_payroll` - Salary and payment history

## API Endpoints

### Workers
```
GET    /api/v1/workers?farm_id={id}     List workers
POST   /api/v1/workers                   Create worker
GET    /api/v1/workers/{id}              Get worker details
PUT    /api/v1/workers/{id}              Update worker
DELETE /api/v1/workers/{id}              Delete worker (soft)
GET    /api/v1/workers/{id}/attendance   Get attendance history
GET    /api/v1/workers/{id}/performance  Get performance reviews
GET    /api/v1/workers/{id}/payroll      Get payroll history
```

### Schedules
```
GET    /api/v1/schedules?farm_id={id}    List schedules
POST   /api/v1/schedules                 Create schedule
GET    /api/v1/schedules/{id}            Get schedule details
PUT    /api/v1/schedules/{id}            Update schedule
DELETE /api/v1/schedules/{id}            Delete schedule
GET    /api/v1/schedules/date/{date}     Get daily schedules
```

### Attendance
```
GET    /api/v1/attendance?worker_id={id} List attendance records
POST   /api/v1/attendance/record         Record attendance
GET    /api/v1/attendance/month/{month}  Get monthly attendance
```

## Key Features
✅ Complete worker lifecycle management
✅ Flexible employment types (full-time, part-time, contract, seasonal)
✅ Schedule creation and management
✅ Daily attendance tracking with check-in/check-out
✅ Performance review system with detailed ratings
✅ Automated payroll processing
✅ Attendance percentage calculation
✅ Monthly payroll reports
✅ Emergency contact information
✅ Soft deletes and audit trails
✅ Role-based permission system

## Implementation Order
1. Create Worker model with relationships
2. Create WorkerSchedule, Attendance, Performance, and Payroll models
3. Create FormRequests
4. Create Controllers
5. Create Services
6. Create Resources
7. Create Policies
8. Add routes with middleware
9. Write comprehensive tests
