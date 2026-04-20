export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    from: number;
    to: number;
    total: number;
    per_page: number;
    last_page: number;
  };
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

export interface ErrorResponse {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}
