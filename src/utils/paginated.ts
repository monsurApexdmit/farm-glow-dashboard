import { PaginatedResponse } from "@/types/api";

export interface ListQueryParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  category?: string;
  priority?: string;
  field_id?: string;
  farm_id?: string;
  role?: string;
  date?: string;
  stock?: string;
}

export function buildQueryString(params: ListQueryParams) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== "all") {
      query.set(key, String(value));
    }
  });

  const value = query.toString();
  return value ? `?${value}` : "";
}

export function normalizePaginatedResponse<T>(
  res: any,
  fallbackPage = 1,
  fallbackPerPage = 10,
  collectionKeys: string[] = []
): PaginatedResponse<T> {
  const keys = ["data", ...collectionKeys];
  let data: T[] = [];
  let usedRawArray = false;

  if (Array.isArray(res)) {
    data = res;
    usedRawArray = true;
  } else {
    for (const key of keys) {
      if (Array.isArray(res?.[key])) {
        data = res[key];
        break;
      }
    }
  }

  const meta = res?.meta || res?.pagination || {};
  const total = Number(meta.total || data.length);
  const perPage = Number(meta.per_page || meta.limit || fallbackPerPage);
  const currentPage = Number(meta.current_page || meta.page || fallbackPage);
  const hasServerMeta = Boolean(
    meta.current_page !== undefined ||
      meta.page !== undefined ||
      meta.total !== undefined ||
      meta.last_page !== undefined ||
      meta.total_pages !== undefined
  );
  const shouldSliceClientSide = usedRawArray || !hasServerMeta;
  const paginatedData = shouldSliceClientSide
    ? data.slice((currentPage - 1) * perPage, currentPage * perPage)
    : data;

  return {
    data: paginatedData,
    meta: {
      current_page: currentPage,
      from: Number(meta.from || (total ? (currentPage - 1) * perPage + 1 : 0)),
      to: Number(meta.to || Math.min(currentPage * perPage, total)),
      total,
      per_page: perPage,
      last_page: Number(
        meta.last_page ||
          meta.total_pages ||
          Math.max(1, Math.ceil(total / perPage))
      ),
    },
  };
}
