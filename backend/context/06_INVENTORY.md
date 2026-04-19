# Inventory Module

## Overview
Comprehensive inventory management system for tracking agricultural supplies, equipment, usage, and stock levels with supplier management.

## Database Tables
- `inventory_items` - Individual inventory items
- `inventory_categories` - Item categorization
- `inventory_suppliers` - Supplier information
- `inventory_transactions` - Usage and consumption tracking
- `inventory_reorder_points` - Stock level alerts

## API Endpoints

### Categories
```
GET    /api/v1/inventory/categories              List categories
POST   /api/v1/inventory/categories              Create category
GET    /api/v1/inventory/categories/{id}         Get category details
PUT    /api/v1/inventory/categories/{id}         Update category
DELETE /api/v1/inventory/categories/{id}         Delete category
```

### Inventory Items
```
GET    /api/v1/inventory?farm_id={id}            List inventory items
POST   /api/v1/inventory                         Add inventory item
GET    /api/v1/inventory/{id}                    Get item details
PUT    /api/v1/inventory/{id}                    Update item
DELETE /api/v1/inventory/{id}                    Delete item
GET    /api/v1/inventory/low-stock               Get low stock items
GET    /api/v1/inventory/expired                 Get expired items
GET    /api/v1/inventory/value                   Get total inventory value
```

### Suppliers
```
GET    /api/v1/suppliers                         List suppliers
POST   /api/v1/suppliers                         Create supplier
GET    /api/v1/suppliers/{id}                    Get supplier details
PUT    /api/v1/suppliers/{id}                    Update supplier
DELETE /api/v1/suppliers/{id}                    Delete supplier
GET    /api/v1/suppliers/{id}/items              Get supplier items
```

### Transactions
```
GET    /api/v1/inventory/transactions            List transactions
POST   /api/v1/inventory/use                     Record item usage
POST   /api/v1/inventory/restock                 Record restock
GET    /api/v1/inventory/transactions/{item_id}  Get item transactions
```

## Key Features
✅ Multi-category inventory management
✅ SKU-based item identification
✅ Supplier relationship tracking
✅ Automatic low-stock alerts
✅ Expiry date tracking
✅ Transaction history (use, restock, adjustment, loss)
✅ Real-time inventory value calculation
✅ Reorder point and quantity automation
✅ Multi-farm inventory tracking
✅ Soft deletes and audit trails

## Implementation Order
1. Create InventoryCategory model
2. Create InventoryItem and InventorySupplier models
3. Create InventoryTransaction and InventoryReorderPoint models
4. Create FormRequests
5. Create Controllers
6. Create Services
7. Create Resources
8. Create Policies
9. Add routes with middleware
10. Write comprehensive tests
