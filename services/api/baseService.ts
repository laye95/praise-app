import { AuthError, PostgrestError } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";

export enum AppErrorCode {
  UNKNOWN = "UNKNOWN",
  NETWORK = "NETWORK",
  AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS",
  AUTH_USER_EXISTS = "AUTH_USER_EXISTS",
  AUTH_WEAK_PASSWORD = "AUTH_WEAK_PASSWORD",
  AUTH_SESSION_MISSING = "AUTH_SESSION_MISSING",
  DATABASE_CONFLICT = "DATABASE_CONFLICT",
  DATABASE_NOT_FOUND = "DATABASE_NOT_FOUND",
  DATABASE_VALIDATION = "DATABASE_VALIDATION",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  RATE_LIMIT = "RATE_LIMIT",
}

export class AppError extends Error {
  code: AppErrorCode;
  originalError?: Error;
  details?: any;

  constructor(
    message: string,
    code: AppErrorCode = AppErrorCode.UNKNOWN,
    originalError?: Error,
    details?: any,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.originalError = originalError;
    this.details = details;
  }
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface FilterParam {
  field: string;
  operator:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "like"
    | "ilike"
    | "in"
    | "is";
  value: any;
}

export interface SortParam {
  field: string;
  ascending?: boolean;
}

export type QueryOptions = {
  filters?: FilterParam[];
  sort?: SortParam[];
  pagination?: PaginationParams;
};

export class BaseService {
  protected supabase = supabase;
  protected tableName?: string;

  protected async executeQuery<T>(
    queryFn: () => Promise<{
      data: any;
      error: any;
      count?: number | null;
    }>,
  ): Promise<T> {
    try {
      const { data, error } = await queryFn();

      if (error) throw error;
      if (data === null || data === undefined)
        throw new Error("No data returned from query");

      return data as T;
    } catch (error) {
      this.log("error", "Query execution failed", error);
      throw this.normalizeError(error);
    }
  }

  protected async get<T>(
    id: string,
    options?: { select?: string },
  ): Promise<T> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use get method");
    }

    this.log("info", `Fetching ${this.tableName} by id`, { id });

    return this.executeQuery<T>(async () => {
      const query = this.supabase
        .from(this.tableName!)
        .select(options?.select || "*")
        .eq("id", id)
        .single();

      return await query;
    });
  }

  protected async list<T>(options?: QueryOptions): Promise<T[]> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use list method");
    }

    this.log("info", `Fetching ${this.tableName} list`);

    return this.executeQuery<T[]>(async () => {
      let query = this.supabase.from(this.tableName!).select("*");

      query = this.applyFilters(query, options?.filters);
      query = this.applySorting(query, options?.sort);
      query = this.applyPagination(query, options?.pagination);

      return await query;
    });
  }

  protected async listPaginated<T>(
    options?: QueryOptions,
  ): Promise<PaginatedResponse<T>> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use listPaginated method");
    }

    const page = options?.pagination?.page || 1;
    const limit = options?.pagination?.limit || 10;

    this.log("info", `Fetching paginated ${this.tableName} list`, {
      page,
      limit,
    });

    try {
      let query = this.supabase
        .from(this.tableName!)
        .select("*", { count: "exact" });

      query = this.applyFilters(query, options?.filters);
      query = this.applySorting(query, options?.sort);
      query = this.applyPagination(query, { page, limit });

      const { data, error, count } = await query;

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        data: data as T[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      this.log("error", "Paginated query failed", error);
      throw this.normalizeError(error);
    }
  }

  protected async create<T, D = Partial<T>>(data: D): Promise<T> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use create method");
    }

    this.log("info", `Creating ${this.tableName}`, data);

    return this.executeQuery<T>(async () => {
      const query = this.supabase
        .from(this.tableName!)
        .insert(data as any)
        .select()
        .single();

      return await query;
    });
  }

  protected async createWithUser<T, D = Partial<T>>(data: D): Promise<T> {
    const dataWithUserId = await this.injectUserId(data as Record<string, any>);
    return this.create<T, any>(dataWithUserId);
  }

  protected async update<T, D = Partial<T>>(id: string, data: D): Promise<T> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use update method");
    }

    this.log("info", `Updating ${this.tableName}`, { id, data });

    return this.executeQuery<T>(async () => {
      const query = this.supabase
        .from(this.tableName!)
        .update(data as any)
        .eq("id", id)
        .select()
        .single();

      return await query;
    });
  }

  protected async delete(id: string): Promise<void> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use delete method");
    }

    this.log("info", `Deleting ${this.tableName}`, { id });

    try {
      const { error } = await this.supabase
        .from(this.tableName!)
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      this.log("error", "Delete failed", error);
      throw this.normalizeError(error);
    }
  }

  protected async batchCreate<T, D = Partial<T>>(items: D[]): Promise<T[]> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use batchCreate method");
    }

    this.log(
      "info",
      `Batch creating ${items.length} ${this.tableName} records`,
    );

    return this.executeQuery<T[]>(async () => {
      const query = this.supabase
        .from(this.tableName!)
        .insert(items as any[])
        .select();

      return await query;
    });
  }

  protected async batchUpdate<T, D = Partial<T>>(
    updates: Array<{ id: string; data: D }>,
  ): Promise<T[]> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use batchUpdate method");
    }

    this.log(
      "info",
      `Batch updating ${updates.length} ${this.tableName} records`,
    );

    const results: T[] = [];

    for (const { id, data } of updates) {
      const result = await this.update<T, D>(id, data);
      results.push(result);
    }

    return results;
  }

  protected async batchDelete(ids: string[]): Promise<void> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use batchDelete method");
    }

    this.log("info", `Batch deleting ${ids.length} ${this.tableName} records`);

    try {
      const { error } = await this.supabase
        .from(this.tableName!)
        .delete()
        .in("id", ids);

      if (error) throw error;
    } catch (error) {
      this.log("error", "Batch delete failed", error);
      throw this.normalizeError(error);
    }
  }

  protected async count(filters?: FilterParam[]): Promise<number> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use count method");
    }

    this.log("info", `Counting ${this.tableName} records`);

    try {
      let query = this.supabase
        .from(this.tableName!)
        .select("*", { count: "exact", head: true });

      query = this.applyFilters(query, filters);

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    } catch (error) {
      this.log("error", "Count failed", error);
      throw this.normalizeError(error);
    }
  }

  protected async exists(id: string): Promise<boolean> {
    if (!this.tableName) {
      throw new Error("tableName must be defined to use exists method");
    }

    try {
      const count = await this.count([
        { field: "id", operator: "eq", value: id },
      ]);
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  private applyFilters(query: any, filters?: FilterParam[]): any {
    if (!filters || filters.length === 0) return query;

    filters.forEach((filter) => {
      switch (filter.operator) {
        case "eq":
          query = query.eq(filter.field, filter.value);
          break;
        case "neq":
          query = query.neq(filter.field, filter.value);
          break;
        case "gt":
          query = query.gt(filter.field, filter.value);
          break;
        case "gte":
          query = query.gte(filter.field, filter.value);
          break;
        case "lt":
          query = query.lt(filter.field, filter.value);
          break;
        case "lte":
          query = query.lte(filter.field, filter.value);
          break;
        case "like":
          query = query.like(filter.field, filter.value);
          break;
        case "ilike":
          query = query.ilike(filter.field, filter.value);
          break;
        case "in":
          query = query.in(filter.field, filter.value);
          break;
        case "is":
          query = query.is(filter.field, filter.value);
          break;
      }
    });

    return query;
  }

  private applySorting(query: any, sort?: SortParam[]): any {
    if (!sort || sort.length === 0) return query;

    sort.forEach((s) => {
      query = query.order(s.field, { ascending: s.ascending ?? true });
    });

    return query;
  }

  private applyPagination(query: any, pagination?: PaginationParams): any {
    if (!pagination) return query;

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    return query.range(from, to);
  }

  protected normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (this.isAuthError(error)) {
      return this.normalizeAuthError(error);
    }

    if (this.isPostgrestError(error)) {
      return this.normalizePostgrestError(error);
    }

    if (error instanceof Error) {
      return new AppError(error.message, AppErrorCode.UNKNOWN, error);
    }

    return new AppError(
      "An unexpected error occurred",
      AppErrorCode.UNKNOWN,
      undefined,
      error,
    );
  }

  private isAuthError(error: unknown): error is AuthError {
    return (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      "message" in error &&
      ("name" in error || "code" in error)
    );
  }

  private isPostgrestError(error: unknown): error is PostgrestError {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      "message" in error &&
      "details" in error
    );
  }

  private normalizeAuthError(error: AuthError): AppError {
    const message = error.message || "Authentication error";

    if (error.status === 400) {
      if (message.includes("already registered")) {
        return new AppError(
          "This email is already registered",
          AppErrorCode.AUTH_USER_EXISTS,
          error,
        );
      }
      if (message.includes("Invalid login credentials")) {
        return new AppError(
          "Invalid email or password",
          AppErrorCode.AUTH_INVALID_CREDENTIALS,
          error,
        );
      }
      if (message.includes("Password")) {
        return new AppError(
          "Password is too weak",
          AppErrorCode.AUTH_WEAK_PASSWORD,
          error,
        );
      }
    }

    if (error.status === 429) {
      return new AppError(
        "Too many attempts. Please try again later",
        AppErrorCode.RATE_LIMIT,
        error,
      );
    }

    return new AppError(message, AppErrorCode.UNKNOWN, error);
  }

  private normalizePostgrestError(error: PostgrestError): AppError {
    const message = error.message || "Database error";

    switch (error.code) {
      case "23505":
        return new AppError(
          "This record already exists",
          AppErrorCode.DATABASE_CONFLICT,
          error as any,
          error.details,
        );
      case "23503":
        return new AppError(
          "Referenced record not found",
          AppErrorCode.DATABASE_NOT_FOUND,
          error as any,
          error.details,
        );
      case "23502":
      case "23514":
        return new AppError(
          "Invalid data provided",
          AppErrorCode.DATABASE_VALIDATION,
          error as any,
          error.details,
        );
      case "42501":
        return new AppError(
          "You don't have permission to perform this action",
          AppErrorCode.PERMISSION_DENIED,
          error as any,
          error.details,
        );
      case "PGRST116":
        return new AppError(
          "Record not found",
          AppErrorCode.DATABASE_NOT_FOUND,
          error as any,
        );
      default:
        return new AppError(
          message,
          AppErrorCode.UNKNOWN,
          error as any,
          error.details,
        );
    }
  }

  protected log(level: "info" | "warn" | "error", message: string, data?: any) {
    if (__DEV__) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case "info":
          console.log(prefix, message, data || "");
          break;
        case "warn":
          console.warn(prefix, message, data || "");
          break;
        case "error":
          console.error(prefix, message, data || "");
          break;
      }
    }
  }

  protected async getCurrentUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error || !user) {
      throw new AppError(
        "User not authenticated",
        AppErrorCode.AUTH_SESSION_MISSING,
        error || undefined,
      );
    }

    return user.id;
  }

  protected async injectUserId<T extends Record<string, any>>(
    data: T,
  ): Promise<T & { user_id: string }> {
    if ("user_id" in data && data.user_id) {
      return data as T & { user_id: string };
    }

    const userId = await this.getCurrentUserId();
    return { ...data, user_id: userId };
  }
}
