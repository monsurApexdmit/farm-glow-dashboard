# Finances Module

## Overview
Comprehensive financial management system for tracking income, expenses, budgets, invoices, and financial reporting.

## Database Tables
- `financial_accounts` - Account management (expenses, revenue, etc.)
- `financial_transactions` - All income and expense transactions
- `financial_invoices` - Invoice tracking
- `financial_budgets` - Budget planning and tracking
- `financial_reports` - Generated financial reports

## API Endpoints

### Accounts
```
GET    /api/v1/accounts                   List accounts
POST   /api/v1/accounts                   Create account
GET    /api/v1/accounts/{id}              Get account details
PUT    /api/v1/accounts/{id}              Update account
DELETE /api/v1/accounts/{id}              Delete account
GET    /api/v1/accounts/{id}/balance      Get account balance
```

### Transactions
```
GET    /api/v1/transactions?farm_id={id}  List transactions
POST   /api/v1/transactions               Create transaction
GET    /api/v1/transactions/{id}          Get transaction details
PUT    /api/v1/transactions/{id}          Update transaction
DELETE /api/v1/transactions/{id}          Delete transaction
GET    /api/v1/transactions/summary       Get transaction summary
```

### Invoices
```
GET    /api/v1/invoices                   List invoices
POST   /api/v1/invoices                   Create invoice
GET    /api/v1/invoices/{id}              Get invoice details
PUT    /api/v1/invoices/{id}              Update invoice
DELETE /api/v1/invoices/{id}              Delete invoice
POST   /api/v1/invoices/{id}/mark-paid    Mark invoice as paid
GET    /api/v1/invoices/overdue           Get overdue invoices
```

### Budgets
```
GET    /api/v1/budgets                    List budgets
POST   /api/v1/budgets                    Create budget
GET    /api/v1/budgets/{id}               Get budget details
PUT    /api/v1/budgets/{id}               Update budget
DELETE /api/v1/budgets/{id}               Delete budget
GET    /api/v1/budgets/summary            Get budget summary
```

### Reports
```
GET    /api/v1/reports                    List reports
POST   /api/v1/reports/generate           Generate financial report
GET    /api/v1/reports/{id}               Get report details
```

## Key Features
✅ Multi-account financial tracking
✅ Flexible transaction categorization
✅ Invoice management with payment tracking
✅ Overdue invoice alerts
✅ Budget planning and tracking
✅ Budget vs actual comparison
✅ Automated financial reports
✅ Monthly, quarterly, yearly reporting
✅ Income and expense categorization
✅ Real-time account balance calculation
✅ Soft deletes and audit trails

## Implementation Order
1. Create FinancialAccount model
2. Create FinancialTransaction and FinancialInvoice models
3. Create FinancialBudget and FinancialReport models
4. Create FormRequests
5. Create Controllers
6. Create Services
7. Create Resources
8. Create Policies
9. Add routes with middleware
10. Write comprehensive tests
