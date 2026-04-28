import { apiClient } from './api';
import { API_ENDPOINTS } from '@/utils/constants';

export interface BackendAccount {
  id: string;
  company_id?: string;
  name: string;
  type: 'expense' | 'revenue' | 'liability' | 'asset';
  balance?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BackendTransaction {
  id: string;
  account_id: string;
  farm_id: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  account?: BackendAccount;
  farm?: { id: string; name: string };
}

export interface BackendInvoice {
  id: string;
  amount?: number;
  status?: string;
  due_date?: string;
  paid_at?: string | null;
  customer_name?: string;
  title?: string;
}

export interface BackendBudget {
  id: string;
  category?: string;
  amount?: number;
  spent?: number;
  period?: string;
}

export interface BackendReport {
  id: string;
  title?: string;
  type?: string;
  status?: string;
  created_at?: string;
}

class FinanceService {
  private list<T>(res: any): T[] {
    return Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
  }

  async getAccounts(): Promise<BackendAccount[]> {
    return this.list<BackendAccount>(await apiClient.get<any>(API_ENDPOINTS.ACCOUNTS));
  }

  async getTransactions(farmId?: string): Promise<BackendTransaction[]> {
    const url = farmId ? `${API_ENDPOINTS.TRANSACTIONS}?farm_id=${farmId}` : API_ENDPOINTS.TRANSACTIONS;
    return this.list<BackendTransaction>(await apiClient.get<any>(url));
  }

  async createTransaction(data: Partial<BackendTransaction>): Promise<BackendTransaction> {
    const res = await apiClient.post<any>(API_ENDPOINTS.TRANSACTIONS, data);
    return (res?.data || res?.transaction || res) as BackendTransaction;
  }

  async updateTransaction(id: string, data: Partial<BackendTransaction>): Promise<BackendTransaction> {
    const res = await apiClient.put<any>(`${API_ENDPOINTS.TRANSACTIONS}/${id}`, data);
    return (res?.data || res?.transaction || res) as BackendTransaction;
  }

  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`${API_ENDPOINTS.TRANSACTIONS}/${id}`);
  }

  async getTransactionSummary(): Promise<Record<string, any>> {
    const res = await apiClient.get<any>(API_ENDPOINTS.TRANSACTIONS_SUMMARY);
    return res?.data || res || {};
  }

  async getInvoices(): Promise<BackendInvoice[]> {
    return this.list<BackendInvoice>(await apiClient.get<any>(API_ENDPOINTS.INVOICES));
  }

  async getOverdueInvoices(): Promise<BackendInvoice[]> {
    return this.list<BackendInvoice>(await apiClient.get<any>(API_ENDPOINTS.INVOICES_OVERDUE));
  }

  async getBudgets(): Promise<BackendBudget[]> {
    return this.list<BackendBudget>(await apiClient.get<any>(API_ENDPOINTS.BUDGETS));
  }

  async getBudgetSummary(): Promise<Record<string, any>> {
    const res = await apiClient.get<any>(API_ENDPOINTS.BUDGETS_SUMMARY);
    return res?.data || res || {};
  }

  async getReports(): Promise<BackendReport[]> {
    return this.list<BackendReport>(await apiClient.get<any>(API_ENDPOINTS.REPORTS));
  }

  async generateReport(data: Record<string, any>): Promise<BackendReport> {
    const res = await apiClient.post<any>(API_ENDPOINTS.REPORTS_GENERATE, data);
    return (res?.data || res?.report || res) as BackendReport;
  }
}

export const financeService = new FinanceService();
