export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8006';

export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/v1/auth/register-company',
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_ME: '/api/v1/auth/me',
  AUTH_LOGOUT: '/api/v1/auth/logout',
  AUTH_REFRESH: '/api/v1/auth/refresh-token',
  AUTH_CHANGE_PASSWORD: '/api/v1/auth/change-password',

  // Farms
  FARMS: '/api/v1/farms',
  FARMS_SUMMARY: (id: string) => `/api/v1/farms/${id}/summary`,
  FARMS_STATS: (id: string) => `/api/v1/farms/${id}/stats`,

  // Fields
  FIELDS: '/api/v1/fields',
  FIELDS_MAP: (id: string) => `/api/v1/fields/${id}/map`,

  // Crops
  CROPS: '/api/v1/crops',
  CROPS_HEALTH: (id: string) => `/api/v1/crops/${id}/health`,
  CROPS_HARVEST: (id: string) => `/api/v1/crops/${id}/harvest`,
  CROPS_YIELD: (id: string) => `/api/v1/crops/${id}/yield`,

  // Livestock
  LIVESTOCK: '/api/v1/livestock',
  LIVESTOCK_HEALTH: (id: string) => `/api/v1/livestock/${id}/health`,

  // Sheds
  SHEDS: '/api/v1/sheds',
  SHEDS_GRID: (id: string) => `/api/v1/sheds/${id}/grid`,
  SHEDS_STATS: (id: string) => `/api/v1/sheds/${id}/stats`,
  SHEDS_CLEAN: (id: string) => `/api/v1/sheds/${id}/clean`,

  // Breeding
  BREEDING: '/api/v1/breeding',
  BREEDING_BIRTH: (id: string) => `/api/v1/breeding/${id}/birth`,

  // Workers
  WORKERS: '/api/v1/workers',
  WORKERS_ATTENDANCE: (id: string) => `/api/v1/workers/${id}/attendance`,
  WORKERS_PERFORMANCE: (id: string) => `/api/v1/workers/${id}/performance`,
  WORKERS_PAYROLL: (id: string) => `/api/v1/workers/${id}/payroll`,

  // Schedules
  SCHEDULES: '/api/v1/schedules',
  SCHEDULES_BY_DATE: '/api/v1/schedules/by-date',

  // Attendance
  ATTENDANCE: '/api/v1/attendance',
  ATTENDANCE_RECORD: '/api/v1/attendance/record',
  ATTENDANCE_MONTHLY: '/api/v1/attendance/monthly',

  // Inventory
  INVENTORY: '/api/v1/inventory',
  INVENTORY_CATEGORIES: '/api/v1/inventory/categories',
  INVENTORY_LOW_STOCK: '/api/v1/inventory/low-stock',
  INVENTORY_EXPIRED: '/api/v1/inventory/expired',
  INVENTORY_VALUE: '/api/v1/inventory/value',
  INVENTORY_TRANSACTIONS: '/api/v1/inventory/transactions',
  INVENTORY_USE: '/api/v1/inventory/use',
  INVENTORY_RESTOCK: '/api/v1/inventory/restock',

  // Suppliers
  SUPPLIERS: '/api/v1/suppliers',
  SUPPLIERS_ITEMS: (id: string) => `/api/v1/suppliers/${id}/items`,

  // Finances
  ACCOUNTS: '/api/v1/accounts',
  ACCOUNTS_BALANCE: (id: string) => `/api/v1/accounts/${id}/balance`,
  TRANSACTIONS: '/api/v1/transactions',
  TRANSACTIONS_SUMMARY: '/api/v1/transactions/summary',
  INVOICES: '/api/v1/invoices',
  INVOICES_OVERDUE: '/api/v1/invoices/overdue',
  INVOICES_MARK_PAID: (id: string) => `/api/v1/invoices/${id}/mark-paid`,
  BUDGETS: '/api/v1/budgets',
  BUDGETS_SUMMARY: '/api/v1/budgets/summary',
  REPORTS: '/api/v1/reports',
  REPORTS_GENERATE: '/api/v1/reports/generate',

  // Users
  USERS_ME: '/api/v1/users/me',
  USERS_PREFERENCES: '/api/v1/users/me/preferences',
  USERS_ACTIVITY: '/api/v1/users/me/activity',
  USERS: '/api/v1/users',
  USERS_TOGGLE_ACTIVE: (id: string) => `/api/v1/users/${id}/toggle-active`,
  USERS_AUDIT_TRAIL: (id: string) => `/api/v1/users/${id}/audit-trail`,

  // Invitations
  INVITATIONS: '/api/v1/invitations',
  INVITATIONS_SEND: '/api/v1/invitations/send',
  INVITATIONS_PENDING: '/api/v1/invitations/pending',
  INVITATIONS_ACCEPT: (token: string) => `/api/v1/invitations/${token}/accept`,
  INVITATIONS_BY_TOKEN: (token: string) => `/api/v1/invitations/${token}`,
};

export const PERMISSIONS = {
  // Farm Management
  VIEW_FARMS: 'view_farms',
  CREATE_FARMS: 'create_farms',
  EDIT_FARMS: 'edit_farms',
  DELETE_FARMS: 'delete_farms',

  // Crop Management
  VIEW_CROPS: 'view_crops',
  CREATE_CROPS: 'create_crops',
  EDIT_CROPS: 'edit_crops',
  DELETE_CROPS: 'delete_crops',
  LOG_CROP_HEALTH: 'log_crop_health',

  // Livestock Management
  VIEW_LIVESTOCK: 'view_livestock',
  CREATE_LIVESTOCK: 'create_livestock',
  EDIT_LIVESTOCK: 'edit_livestock',
  DELETE_LIVESTOCK: 'delete_livestock',
  LOG_LIVESTOCK_HEALTH: 'log_livestock_health',
  MANAGE_LIVESTOCK_BREEDING: 'manage_livestock_breeding',

  // Worker Management
  VIEW_WORKERS: 'view_workers',
  MANAGE_WORKERS: 'manage_workers',
  VIEW_WORKER_SCHEDULES: 'view_worker_schedules',
  MANAGE_WORKER_SCHEDULES: 'manage_worker_schedules',
  RECORD_ATTENDANCE: 'record_attendance',
  VIEW_ATTENDANCE: 'view_attendance',
  REVIEW_WORKER_PERFORMANCE: 'review_worker_performance',

  // Inventory Management
  VIEW_INVENTORY: 'view_inventory',
  MANAGE_INVENTORY: 'manage_inventory',

  // Financial Management
  VIEW_FINANCES: 'view_finances',
  MANAGE_FINANCES: 'manage_finances',
  MANAGE_PAYROLL: 'manage_payroll',
  GENERATE_REPORTS: 'generate_reports',

  // User Management
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
};

export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  FARMER: 'farmer',
  WORKER: 'worker',
};
