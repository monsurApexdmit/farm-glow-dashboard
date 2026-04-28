export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  deleted_by?: string;
}

export interface Farm extends BaseEntity {
  name: string;
  location: string;
  total_area: number;
  unit?: string;
  farm_type: string;
  soil_type: string;
  climate_zone: string;
  company_id: string;
  image_url?: string;
  deleted_at?: string;
}

export interface Field extends BaseEntity {
  farm_id: string;
  name: string;
  area: number;
  unit?: string;
  soil_type: string;
  status?: string;
  latitude: number;
  longitude: number;
  deleted_at?: string;
}

export interface Crop extends BaseEntity {
  field_id: string;
  name: string;
  type: string;
  planting_date: string;
  expected_harvest_date: string;
  quantity_planted: number;
  target_yield: number;
  estimated_yield?: number;
  actual_yield?: number;
  yield_unit?: string;
  status: 'planning' | 'growing' | 'harvested';
  deleted_at?: string;
}

export interface Livestock extends BaseEntity {
  farm_id: string;
  shed_id?: string;
  name: string;
  type?: string;
  breed: string;
  tag_number: string;
  date_of_birth: string;
  weight: number;
  gender?: string;
  status: 'healthy' | 'sick' | 'quarantined' | 'deceased';
  livestock_type_id?: number;
  deleted_at?: string;
}

export interface LivestockShed extends BaseEntity {
  farm_id: string;
  name: string;
  type: string;
  capacity: number;
  length: number;
  width: number;
  height: number;
  constructed_date: string;
  grid_row?: number;
  grid_col?: number;
  grid_row_span?: number;
  grid_col_span?: number;
  deleted_at?: string;
}

export interface Worker extends BaseEntity {
  farm_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'seasonal';
  position: string;
  start_date: string;
  hourly_rate?: number;
  monthly_rate?: number;
  is_active: boolean;
  emergency_contact?: string;
  deleted_at?: string;
}

export interface InventoryItem extends BaseEntity {
  farm_id: string;
  category_id: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  unit_price: number;
  reorder_level: number;
  reorder_quantity: number;
  supplier_id?: string;
  expiry_date?: string;
  deleted_at?: string;
}

export interface FinancialAccount extends BaseEntity {
  company_id: string;
  name: string;
  type: 'expense' | 'revenue' | 'liability' | 'asset';
  balance: number;
  description?: string;
  deleted_at?: string;
}

export interface FinancialTransaction extends BaseEntity {
  account_id: string;
  farm_id: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  notes?: string;
  deleted_at?: string;
}
