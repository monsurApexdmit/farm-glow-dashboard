# Frontend Implementation Plan - Farm Glow Dashboard

**Status**: Frontend planning phase  
**Last Updated**: 2026-04-20  
**Backend API**: Complete with all endpoints in `/routes/api.php`

---

## 📋 Overview

This document outlines all frontend features and screens needed to consume the complete backend API. The backend supports 9 major modules with 50+ endpoints across authentication, farms, crops, livestock, workers, inventory, and financial management.

---

## 🔐 1. Authentication Module

### Features to Implement
- ✅ Company Registration (register-company)
- ✅ User Login (login)
- ✅ JWT Token Management (refresh-token, logout)
- ✅ Current User Profile (me)
- ✅ Change Password

### Screens/Pages Needed
1. **Auth/Register** - Company & owner registration form
   - Company name, email, password
   - Terms & conditions acceptance
   - Success message with login redirect

2. **Auth/Login** - User login
   - Email & password input
   - "Remember me" checkbox
   - Forgot password link (optional for MVP)
   - Token storage (localStorage/sessionStorage)

3. **Auth/ChangePassword** - Password change in settings
   - Current password validation
   - New password with confirmation
   - Success notification

### API Endpoints Used
```
POST   /api/v1/auth/register-company
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/change-password
```

### Dependencies
- JWT token interceptor in HTTP client
- Auth service with token refresh logic
- Protected route guard for authenticated pages

---

## 🚜 2. Farms Module

### Features to Implement
- CRUD operations for farms
- Farm summary (crops count, fields count, workers count)
- Farm statistics (area, yield, inventory value)
- Multi-farm navigation

### Screens/Pages Needed
1. **Farms/List** - Dashboard with farm cards
   - Grid/list view toggle
   - Quick stats (fields, crops, workers)
   - Actions: Create, Edit, Delete, View Details
   - Search and filter

2. **Farms/Create** - Farm creation form
   - Farm name, location, total area
   - Farm type selection (crop, livestock, mixed)
   - Soil type selection
   - Climate zone

3. **Farms/Edit** - Edit farm information
   - All creation fields editable
   - Photo/banner upload
   - Soft delete with restore option

4. **Farms/Detail** - Farm overview dashboard
   - Summary widgets (fields, crops, animals, workers)
   - Recent activity feed
   - Quick action buttons
   - Statistics charts

### Fields Module (Nested under Farms)
1. **Fields/List** - Table of fields
   - Field name, area, soil type, status
   - Quick actions
   - Add field button

2. **Fields/Create & Edit** - Field form
   - Field name, area, coordinates
   - Soil type dropdown
   - Map selector for coordinates

3. **Fields/Map** - Visual field mapping
   - Interactive map with field boundaries
   - Coordinates display

### API Endpoints Used
```
GET    /api/v1/farms
POST   /api/v1/farms
GET    /api/v1/farms/{id}
PUT    /api/v1/farms/{id}
DELETE /api/v1/farms/{id}
GET    /api/v1/farms/{id}/summary
GET    /api/v1/farms/{id}/stats

GET    /api/v1/fields
POST   /api/v1/fields
GET    /api/v1/fields/{id}
PUT    /api/v1/fields/{id}
DELETE /api/v1/fields/{id}
GET    /api/v1/fields/{id}/map
```

---

## 🌾 3. Crops Module

### Features to Implement
- Crop lifecycle management (planning → growing → harvested)
- Health tracking with historical records
- Harvest recording with yield tracking
- Crop visualization with status indicators

### Screens/Pages Needed
1. **Crops/List** - Crop inventory table
   - Filter by farm, field, status, crop type
   - Quick stats per crop (health status, age)
   - Bulk actions
   - Create crop button

2. **Crops/Create & Edit** - Crop form
   - Crop name/type selector
   - Field selection (dropdown)
   - Planting date, expected harvest date
   - Quantity/area planted
   - Target yield

3. **Crops/Detail** - Crop detail view
   - Basic info card
   - Health status timeline
   - Health records log with add button
   - Harvest history
   - Yield information
   - Status update dropdown

4. **Crops/Health** - Health tracking
   - Health records table (date, status, notes, images)
   - Add health record form
   - Health status trend chart
   - Alert system for poor health

5. **Crops/Harvest** - Harvest management
   - Harvest records table
   - Add harvest record form
   - Yield analysis
   - Crop status change to "Harvested"

### API Endpoints Used
```
GET    /api/v1/crops
POST   /api/v1/crops
GET    /api/v1/crops/{id}
PUT    /api/v1/crops/{id}
DELETE /api/v1/crops/{id}
POST   /api/v1/crops/{id}/health
GET    /api/v1/crops/{id}/health
POST   /api/v1/crops/{id}/harvest
GET    /api/v1/crops/{id}/yield
```

---

## 🐄 4. Livestock Module

### Features to Implement
- Individual animal tracking with tag numbers
- Health monitoring with historical records
- Breeding management with genealogy
- Visual grid-based shed management
- Shed capacity and occupancy tracking
- Animal type classification with icons

### Screens/Pages Needed

#### Livestock Management
1. **Livestock/List** - Animal inventory table
   - Filter by farm, shed, type, status
   - Animal name, tag number, breed, age
   - Health status indicator
   - Quick actions (view, edit, delete)

2. **Livestock/Create & Edit** - Animal form
   - Farm selection
   - Animal type (cattle, poultry, goat, pig, etc.)
   - Breed selection
   - Tag/ID number
   - Birth date
   - Current weight
   - Shed assignment
   - Health status

3. **Livestock/Detail** - Animal profile
   - Basic info card with photo
   - Health status and records
   - Breeding history
   - Weight tracking chart
   - Timeline of events

4. **Livestock/Health** - Health tracking
   - Health records table
   - Add health record form
   - Health status trend
   - Vaccination schedule (if applicable)

#### Shed Management
1. **Sheds/List** - Shed overview
   - Shed name, type, capacity, occupancy
   - Status indicator (clean, needs cleaning)
   - Temperature/humidity if available
   - Actions: Edit, View Grid, View Stats

2. **Sheds/Create & Edit** - Shed form
   - Farm selection
   - Shed name, type, capacity
   - Dimensions (length, width, height)
   - Construction date

3. **Sheds/Grid** - Visual grid-based management
   - Grid view showing shed layout
   - Animal positions in grid
   - Drag-to-move functionality (optional)
   - Click to view animal details
   - Add/remove animals from shed
   - Clean shed button
   - Occupancy percentage

4. **Sheds/Stats** - Shed statistics
   - Occupancy chart
   - Temperature/humidity graphs
   - Cleaning schedule
   - Animal distribution by type

#### Breeding Records
1. **Breeding/List** - Breeding records table
   - Sire, dam, offspring animals
   - Breeding date, expected birth
   - Status (planning, pregnant, completed)
   - Actions

2. **Breeding/Create & Edit** - Breeding form
   - Sire selection
   - Dam selection
   - Breeding date
   - Expected birth date
   - Notes

3. **Breeding/Detail** - Genealogy view
   - Family tree visualization
   - Birth recording form
   - Offspring list

4. **Breeding/Birth** - Birth recording
   - Offspring count
   - Individual animal data for each offspring
   - Health status
   - Birth date and time

### API Endpoints Used
```
GET    /api/v1/livestock
POST   /api/v1/livestock
GET    /api/v1/livestock/{id}
PUT    /api/v1/livestock/{id}
DELETE /api/v1/livestock/{id}
POST   /api/v1/livestock/{id}/health
GET    /api/v1/livestock/{id}/health

GET    /api/v1/sheds
POST   /api/v1/sheds
GET    /api/v1/sheds/{id}
PUT    /api/v1/sheds/{id}
DELETE /api/v1/sheds/{id}
GET    /api/v1/sheds/{id}/grid
POST   /api/v1/sheds/{id}/clean
GET    /api/v1/sheds/{id}/stats

GET    /api/v1/breeding
POST   /api/v1/breeding
GET    /api/v1/breeding/{id}
PUT    /api/v1/breeding/{id}
DELETE /api/v1/breeding/{id}
POST   /api/v1/breeding/{id}/birth
```

---

## 👨‍🌾 5. Workers Module

### Features to Implement
- Complete worker lifecycle management
- Flexible employment types (full-time, part-time, contract, seasonal)
- Schedule creation and management
- Daily attendance tracking
- Performance review system
- Payroll management

### Screens/Pages Needed

#### Worker Management
1. **Workers/List** - Worker directory
   - Table with name, role, employment type, status
   - Contact information
   - Quick stats (attendance %, reviews)
   - Filter by employment type, status
   - Create worker button

2. **Workers/Create & Edit** - Worker form
   - Personal info (name, email, phone, address)
   - Employment type (full-time, part-time, contract, seasonal)
   - Position/role
   - Start date
   - Hourly/monthly rate
   - Emergency contact

3. **Workers/Detail** - Worker profile
   - Basic info card with avatar
   - Recent attendance
   - Performance rating
   - Next scheduled shift
   - Quick action buttons

4. **Workers/Attendance** - Attendance history
   - Attendance records table
   - Check-in/out times
   - Monthly attendance percentage
   - Absences and leaves

5. **Workers/Performance** - Performance reviews
   - Review history table
   - Ratings breakdown
   - Add review form
   - Performance trend chart

6. **Workers/Payroll** - Payroll history
   - Payroll records table
   - Amount, date, status
   - Download payslip option

#### Schedule Management
1. **Schedules/List** - Schedule calendar view
   - Monthly/weekly/daily view toggle
   - Worker filter
   - Create schedule button
   - Color-coded shifts

2. **Schedules/Create & Edit** - Schedule form
   - Worker selection
   - Date and time range
   - Shift type
   - Task/assignment description
   - Recurring schedule option

3. **Schedules/ByDate** - Daily view
   - All schedules for selected date
   - Worker assignments
   - Task details

#### Attendance Tracking
1. **Attendance/Record** - Check-in/out
   - Worker selection
   - Check-in/out button
   - Current time display
   - Notes field

2. **Attendance/List** - Attendance records
   - Table with worker, check-in, check-out, duration
   - Daily/monthly filters
   - Export to CSV

3. **Attendance/Monthly** - Monthly report
   - Attendance summary by worker
   - Percentage calculation
   - Absent days
   - Leave days

### API Endpoints Used
```
GET    /api/v1/workers
POST   /api/v1/workers
GET    /api/v1/workers/{id}
PUT    /api/v1/workers/{id}
DELETE /api/v1/workers/{id}
GET    /api/v1/workers/{id}/attendance
GET    /api/v1/workers/{id}/performance
GET    /api/v1/workers/{id}/payroll

GET    /api/v1/schedules
POST   /api/v1/schedules
GET    /api/v1/schedules/{id}
PUT    /api/v1/schedules/{id}
DELETE /api/v1/schedules/{id}
GET    /api/v1/schedules/by-date

GET    /api/v1/attendance
POST   /api/v1/attendance/record
GET    /api/v1/attendance/monthly
```

---

## 📦 6. Inventory Module

### Features to Implement
- Multi-category inventory management
- SKU-based item identification
- Supplier relationship tracking
- Automatic low-stock alerts
- Expiry date tracking
- Transaction history (use, restock, adjustment, loss)
- Real-time inventory value calculation

### Screens/Pages Needed

#### Category Management
1. **Inventory/Categories/List** - Category list
   - Table with category name, description, item count
   - Create, edit, delete buttons

2. **Inventory/Categories/Create & Edit** - Category form
   - Category name
   - Description

#### Inventory Items
1. **Inventory/List** - Inventory items table
   - SKU, name, category, quantity, unit
   - Reorder level indicator (red if below)
   - Expiry status (yellow if near expiry)
   - Unit price, total value
   - Last updated date
   - Filters: category, farm, low-stock, expired
   - Create item button

2. **Inventory/Create & Edit** - Item form
   - SKU (auto-generated or manual)
   - Item name
   - Category selection
   - Unit (kg, liter, pieces, etc.)
   - Current quantity
   - Unit price
   - Reorder level
   - Reorder quantity
   - Supplier selection (dropdown)
   - Expiry date
   - Notes

3. **Inventory/Detail** - Item detail view
   - Basic info card
   - Stock level with reorder indicator
   - Expiry status
   - Supplier information
   - Transaction history
   - Stock chart (quantity over time)

4. **Inventory/LowStock** - Low stock alerts
   - Table of items below reorder level
   - Quantity available vs reorder level
   - Quick restock button
   - Suggested supplier

5. **Inventory/Expired** - Expired items view
   - Table of expired items
   - Date expired
   - Quantity still in stock
   - Remove from stock button

6. **Inventory/Value** - Inventory value report
   - Total inventory value
   - Value by category
   - Value by farm
   - Value trend chart

#### Supplier Management
1. **Suppliers/List** - Supplier directory
   - Supplier name, contact, email, phone
   - Item count supplied
   - Average lead time
   - Rating/reliability
   - Actions

2. **Suppliers/Create & Edit** - Supplier form
   - Company name
   - Contact person
   - Email, phone
   - Address
   - Payment terms
   - Lead time (days)
   - Notes

3. **Suppliers/Items** - Supplier inventory
   - Items supplied by this supplier
   - SKU, name, price from supplier
   - Last order date

#### Transactions
1. **Inventory/Transactions** - Transaction history
   - Table with date, type (use, restock, adjustment, loss)
   - Item name, quantity
   - Farm location
   - Notes
   - Created by, created at
   - Filters: type, date range, item

2. **Inventory/Use** - Record item usage
   - Item selection
   - Quantity used
   - Farm/location
   - Purpose/reason
   - Notes

3. **Inventory/Restock** - Record restock
   - Item selection
   - Quantity added
   - Supplier selection
   - Cost
   - Invoice/receipt number
   - Delivery date

4. **Inventory/ItemTransactions** - Item transaction history
   - All transactions for specific item
   - Timeline view

### API Endpoints Used
```
GET    /api/v1/inventory/categories
POST   /api/v1/inventory/categories
GET    /api/v1/inventory/categories/{id}
PUT    /api/v1/inventory/categories/{id}
DELETE /api/v1/inventory/categories/{id}

GET    /api/v1/inventory
POST   /api/v1/inventory
GET    /api/v1/inventory/{id}
PUT    /api/v1/inventory/{id}
DELETE /api/v1/inventory/{id}
GET    /api/v1/inventory/low-stock
GET    /api/v1/inventory/expired
GET    /api/v1/inventory/value
GET    /api/v1/inventory/transactions
POST   /api/v1/inventory/use
POST   /api/v1/inventory/restock
GET    /api/v1/inventory/transactions/{item}

GET    /api/v1/suppliers
POST   /api/v1/suppliers
GET    /api/v1/suppliers/{id}
PUT    /api/v1/suppliers/{id}
DELETE /api/v1/suppliers/{id}
GET    /api/v1/suppliers/{id}/items
```

---

## 💰 7. Financial Module

### Features to Implement
- Multi-account financial tracking
- Flexible transaction categorization
- Invoice management with payment tracking
- Overdue invoice alerts
- Budget planning and tracking
- Budget vs actual comparison
- Automated financial reports
- Monthly, quarterly, yearly reporting

### Screens/Pages Needed

#### Account Management
1. **Accounts/List** - Account directory
   - Account name, type (expense, revenue, liability)
   - Balance display
   - Actions: view, edit, delete

2. **Accounts/Create & Edit** - Account form
   - Account name
   - Account type dropdown
   - Description
   - Initial balance (for new accounts)

3. **Accounts/Balance** - Account balance detail
   - Current balance
   - Transaction history filtered to this account
   - Balance over time chart

#### Transactions
1. **Transactions/List** - Transaction ledger
   - Date, account, category, description
   - Amount (income/expense)
   - Balance after transaction
   - Filter by date range, account, type
   - Create transaction button

2. **Transactions/Create & Edit** - Transaction form
   - Account selection
   - Date
   - Category (dropdown)
   - Description
   - Amount
   - Notes
   - Attachment (receipt/invoice upload)

3. **Transactions/Summary** - Transaction summary report
   - Total income, total expenses, net
   - By category breakdown (chart)
   - By month breakdown (chart)
   - Date range filter

#### Invoices
1. **Invoices/List** - Invoice register
   - Invoice number, date, customer, amount
   - Status (draft, issued, paid, overdue)
   - Due date
   - Quick actions: view, edit, mark paid
   - Filter by status

2. **Invoices/Create & Edit** - Invoice form
   - Invoice number (auto-generated)
   - Customer name
   - Invoice date, due date
   - Line items (description, quantity, unit price)
   - Total amount
   - Payment terms
   - Notes

3. **Invoices/Detail** - Invoice detail view
   - Full invoice display/preview
   - Payment status
   - Mark paid button
   - Download PDF button
   - Edit button

4. **Invoices/Overdue** - Overdue invoices
   - Table of overdue invoices
   - Days overdue
   - Amount due
   - Actions: send reminder, mark paid, edit

#### Budgets
1. **Budgets/List** - Budget planning
   - Budget name, period (monthly, quarterly, yearly)
   - Total budgeted amount
   - Amount spent
   - Remaining budget
   - Progress percentage
   - Status (on-track, warning, exceeded)

2. **Budgets/Create & Edit** - Budget form
   - Budget name
   - Period dropdown
   - Start and end date
   - Category allocation table
   - Total budget amount

3. **Budgets/Detail** - Budget tracking
   - Budgeted amount by category
   - Actual spending by category
   - Variance (over/under)
   - Visual comparison (chart)
   - Spending trend

4. **Budgets/Summary** - Budget overview report
   - All active budgets status
   - Total budgeted vs actual
   - Budget by category comparison

#### Reports
1. **Reports/List** - Financial reports
   - Report name, type, date generated
   - Download button (PDF, CSV)

2. **Reports/Create** - Generate report
   - Report type selector (P&L, Balance Sheet, Cash Flow, etc.)
   - Date range
   - Scope (by category, by farm, by account)
   - Generate button

3. **Reports/Detail** - Report view
   - Full report display
   - Charts and visualizations
   - Print button
   - Download options

### API Endpoints Used
```
GET    /api/v1/accounts
POST   /api/v1/accounts
GET    /api/v1/accounts/{id}
PUT    /api/v1/accounts/{id}
DELETE /api/v1/accounts/{id}
GET    /api/v1/accounts/{id}/balance

GET    /api/v1/transactions
POST   /api/v1/transactions
GET    /api/v1/transactions/{id}
PUT    /api/v1/transactions/{id}
DELETE /api/v1/transactions/{id}
GET    /api/v1/transactions/summary

GET    /api/v1/invoices
POST   /api/v1/invoices
GET    /api/v1/invoices/{id}
PUT    /api/v1/invoices/{id}
DELETE /api/v1/invoices/{id}
POST   /api/v1/invoices/{id}/mark-paid
GET    /api/v1/invoices/overdue

GET    /api/v1/budgets
POST   /api/v1/budgets
GET    /api/v1/budgets/{id}
PUT    /api/v1/budgets/{id}
DELETE /api/v1/budgets/{id}
GET    /api/v1/budgets/summary

GET    /api/v1/reports
POST   /api/v1/reports/generate
GET    /api/v1/reports/{id}
```

---

## 👥 8. Users Module

### Features to Implement
- Comprehensive user profile management
- User preferences and settings
- Activity logging for audit purposes
- User invitation system
- Role and permission management
- Avatar upload support
- User status management

### Screens/Pages Needed

#### User Profile
1. **Users/Profile** - My profile
   - Avatar display/upload
   - Name, email, phone
   - Edit profile button
   - Change password section

2. **Users/Edit Profile** - Edit personal info
   - First name, last name
   - Email
   - Phone number
   - Avatar upload/crop
   - Save button

3. **Users/Preferences** - User settings
   - Language selection
   - Timezone selection
   - Theme (light/dark)
   - Notification preferences
   - Default farm/view selection

4. **Users/Activity** - My activity log
   - Table of user actions
   - Timestamp, action, resource
   - Filter by action type

#### User Management (Admin/Manager only)
1. **Users/List** - User directory
   - Table with name, email, role, status
   - Status indicator (active/inactive)
   - Last login date
   - Filter by role, status
   - Create user button

2. **Users/Create** - Create user
   - First name, last name
   - Email
   - Phone
   - Role selection (dropdown)
   - Password (auto-generated, user changes on first login)
   - Send invitation checkbox

3. **Users/Edit** - Edit user
   - All creation fields editable
   - Role change dropdown
   - Status toggle (active/inactive)
   - Permissions override option

4. **Users/Detail** - User detail view
   - Full user profile
   - Roles and permissions
   - Activity history
   - Audit trail
   - Actions: edit, toggle status, delete

5. **Users/ToggleActive** - User status management
   - Toggle active/inactive button
   - Confirmation dialog

6. **Users/Activity** - User activity audit
   - Activity log for specific user
   - All actions with timestamp
   - Resource affected

7. **Users/AuditTrail** - Audit trail view
   - Comprehensive audit log
   - Who changed what, when
   - Before/after values
   - IP address, user agent

#### Invitations
1. **Invitations/List** - Pending invitations
   - User email, role, status
   - Sent date, expires date
   - Resend button, delete button

2. **Invitations/Send** - Send user invitation
   - Email address
   - Role selection
   - Custom message (optional)
   - Send button

3. **Invitations/GetByToken** - Accept invitation
   - Invitation detail (email, role, company)
   - Password setup form
   - Accept button

4. **Invitations/Accept** - Complete registration via invite
   - Password setup
   - Name confirmation
   - First login

### API Endpoints Used
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
GET    /api/v1/users/me/preferences
PUT    /api/v1/users/me/preferences
POST   /api/v1/users/me/change-password
GET    /api/v1/users/me/activity

GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/{id}
PUT    /api/v1/users/{id}
DELETE /api/v1/users/{id}
POST   /api/v1/users/{id}/toggle-active
GET    /api/v1/users/{id}/activity
GET    /api/v1/users/{id}/audit-trail

GET    /api/v1/invitations
POST   /api/v1/invitations/send
GET    /api/v1/invitations/pending
GET    /api/v1/invitations/{token}
POST   /api/v1/invitations/{token}/accept
DELETE /api/v1/invitations/{id}
```

---

## 📊 9. Dashboard & Analytics

### Screens/Pages Needed
1. **Dashboard/Home** - Main dashboard
   - Quick stats cards (total farms, animals, crops, workers)
   - Recent activities feed
   - Alerts (low stock, overdue invoices, crop health)
   - Quick action buttons
   - Charts (revenue, crop yield, etc.)

2. **Dashboard/Analytics** - Comprehensive analytics
   - Multiple chart types (line, bar, pie, area)
   - Farm performance metrics
   - Worker productivity
   - Financial summaries
   - Custom date ranges
   - Export capability

3. **Notifications** - Notification center
   - Unread notifications list
   - Mark as read
   - Delete notifications
   - Filter by type

---

## 🗂️ 10. Common Components

### Reusable Components Needed
1. **Forms**
   - Text input with validation
   - Select/dropdown with search
   - Date picker
   - Time picker
   - File upload
   - Rich text editor
   - Multi-select checkbox

2. **Tables**
   - Sortable columns
   - Pagination
   - Row selection (bulk actions)
   - Expandable rows
   - Search/filter in table
   - Column visibility toggle
   - Export to CSV

3. **Cards & Layouts**
   - Stat card (value + label)
   - List card
   - Grid layout
   - Modal dialog
   - Side drawer
   - Tabs
   - Accordion

4. **Charts**
   - Line chart
   - Bar chart
   - Pie/Doughnut chart
   - Area chart
   - Stacked chart
   - Multi-axis chart

5. **Status Indicators**
   - Badge (status colors)
   - Alert/Warning component
   - Progress bar
   - Spinner/Loading state
   - Empty state message

6. **Navigation**
   - Main sidebar
   - Top navigation bar
   - Breadcrumbs
   - Tab navigation
   - Dropdown menus

---

## 🔒 11. Permission-Based UI

### Implementation Requirements
- 24 permissions across 7 categories
- 4 roles: Owner, Manager, Farmer, Worker
- Feature visibility based on user permissions
- Route guards for protected pages
- Button/action visibility based on permissions
- Form field visibility based on permissions

### Permission Mapping
```
Owner Role (24/24) → Full access to all features
Manager (20/24) → Exclude: payroll management, report generation, user management
Farmer (15/24) → View-edit crops/livestock, limited HR/inventory/finances
Worker (3/24) → View-only: farms, inventory, finances
```

---

## 📱 12. Technical Architecture

### Frontend Stack (Recommended)
- **Framework**: React (assuming existing setup)
- **State Management**: Redux/Context API
- **HTTP Client**: Axios with JWT interceptor
- **Charts**: Chart.js or Recharts
- **UI Components**: Material-UI, Ant Design, or custom
- **Forms**: React Hook Form + Zod/Yup validation
- **Date Management**: date-fns or Day.js

### Required Services/Hooks
1. **AuthService**
   - Login, logout, register
   - Token refresh
   - Current user
   - Password change

2. **APIService** (per module)
   - Farm service
   - Crop service
   - Livestock service
   - Worker service
   - Inventory service
   - Financial service
   - User service

3. **Hooks**
   - useAuth() - Current user & auth state
   - useUser() - User context
   - usePagination() - Pagination logic
   - useFetch() - Data fetching with loading/error
   - usePermission() - Permission checking

### API Error Handling
- 401 → Redirect to login, refresh token
- 403 → Show permission denied message
- 404 → Show not found page
- 422 → Display form validation errors
- 500+ → Show server error message
- Retry logic with exponential backoff

---

## 🎯 Implementation Priority

### Phase 1: Core (Weeks 1-2)
- [ ] Auth pages (register, login)
- [ ] Dashboard home
- [ ] Farms module (list, create, edit)
- [ ] Navigation & layout
- [ ] Permission system

### Phase 2: Production (Weeks 3-4)
- [ ] Crops module (full CRUD + health)
- [ ] Livestock module (animals only)
- [ ] Workers module (list, create, detail)
- [ ] Inventory module (basic)
- [ ] User profile management

### Phase 3: Advanced (Weeks 5-6)
- [ ] Sheds with grid view
- [ ] Breeding records
- [ ] Financial module (full)
- [ ] Advanced scheduling
- [ ] Reports & analytics

### Phase 4: Polish (Week 7)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Error handling refinement
- [ ] Testing & QA
- [ ] Documentation

---

## 📝 Notes

- All endpoints require `auth:api` middleware (authenticated)
- Multi-tenancy: All data filtered by company_id at backend
- Soft deletes: Include "restore" functionality in UI
- Audit trails: Show created_by, updated_at information
- Pagination: Implement for large data sets (50+ items)
- Search/Filter: Implement for main list views
- Real-time updates: Consider WebSockets for shared data
- Offline support: Consider service workers for offline mode

---

**Created**: 2026-04-20  
**Last Updated**: 2026-04-20
