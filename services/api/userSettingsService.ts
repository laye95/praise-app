import { BaseService } from "./baseService";

export interface UserSettings {
  id: string;
  user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class UserSettingsService extends BaseService {
  protected tableName = "user_settings";

  async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw this.normalizeError(error);
      }

      return data as UserSettings;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async getSetting<T = any>(userId: string, key: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase.rpc("get_user_setting", {
        p_user_id: userId,
        p_setting_key: key,
      });

      if (error) {
        throw this.normalizeError(error);
      }

      return data as T | null;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  async setSetting(
    userId: string,
    key: string,
    value: any,
  ): Promise<UserSettings> {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const delay = attempt * 200;
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        const { data, error } = await this.supabase.rpc("set_user_setting", {
          p_user_id: userId,
          p_setting_key: key,
          p_setting_value: value,
        });

        if (error) {
          const errorMessage = (error.message || "").toLowerCase();
          const errorDetails = (error.details || "").toLowerCase();
          const errorHint = (error.hint || "").toLowerCase();

          const isUserNotFoundError =
            errorMessage.includes("user record not found") ||
            errorMessage.includes("trigger may not have completed") ||
            errorMessage.includes("referenced record not found") ||
            errorDetails.includes("public.users") ||
            errorDetails.includes("user record not found") ||
            error.code === "23503" ||
            error.code === "PGRST116";

          if (isUserNotFoundError && attempt < maxRetries - 1) {
            this.log(
              "warn",
              `User record not ready (attempt ${attempt + 1}/${maxRetries}), retrying...`,
              {
                userId,
                key,
                errorMessage: error.message,
                errorCode: error.code,
                errorDetails: error.details,
              },
            );
            lastError = error;
            continue;
          }

          const normalizedError = this.normalizeError(error);
          const normalizedMessage = (
            normalizedError.message || ""
          ).toLowerCase();

          if (
            (normalizedMessage.includes("user record not found") ||
              normalizedMessage.includes("trigger may not have completed") ||
              normalizedMessage.includes("referenced record not found") ||
              normalizedError.code === "DATABASE_NOT_FOUND") &&
            attempt < maxRetries - 1
          ) {
            this.log(
              "warn",
              `User record not ready after normalization (attempt ${attempt + 1}/${maxRetries}), retrying...`,
              {
                userId,
                key,
                normalizedMessage: normalizedError.message,
                errorCode: normalizedError.code,
              },
            );
            lastError = normalizedError;
            continue;
          }

          throw normalizedError;
        }

        const settings = await this.getUserSettings(userId);
        if (!settings) {
          this.log("warn", "Failed to retrieve settings, but RPC succeeded", {
            userId,
          });
          return {
            id: "",
            user_id: userId,
            settings: { [key]: value },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }

        return settings;
      } catch (error: any) {
        const errorMessage = ((error?.message || "") as string).toLowerCase();
        const isUserNotFoundError =
          errorMessage.includes("user record not found") ||
          errorMessage.includes("trigger may not have completed") ||
          errorMessage.includes("referenced record not found") ||
          error?.code === "DATABASE_NOT_FOUND" ||
          error?.code === "23503" ||
          (error instanceof Error && errorMessage.includes("public.users"));

        if (isUserNotFoundError && attempt < maxRetries - 1) {
          this.log(
            "warn",
            `User record not ready in catch block (attempt ${attempt + 1}/${maxRetries}), retrying...`,
            {
              userId,
              key,
              errorMessage: error?.message,
              errorCode: error?.code,
              errorType: error?.constructor?.name,
            },
          );
          lastError = error;
          continue;
        }

        this.log("error", "Failed to set user setting after retries", {
          userId,
          key,
          error,
          attempt,
        });
        throw this.normalizeError(error);
      }
    }

    this.log("error", "Failed to set user setting after all retries", {
      userId,
      key,
      lastError,
    });

    const finalError = lastError
      ? this.normalizeError(lastError)
      : new Error("Failed to set user setting after retries");

    const errorMessage = (finalError.message || "").toLowerCase();
    const isUserNotFoundError =
      errorMessage.includes("user record not found") ||
      errorMessage.includes("trigger may not have completed") ||
      errorMessage.includes("referenced record not found") ||
      (finalError as any).code === "DATABASE_NOT_FOUND";

    if (isUserNotFoundError) {
      const userNotFoundError = new Error(
        "User record not found after all retries. Session may be invalid.",
      );
      (userNotFoundError as any).code = "USER_RECORD_NOT_FOUND";
      (userNotFoundError as any).requiresLogout = true;
      throw userNotFoundError;
    }

    throw finalError;
  }

  async updateSettings(
    userId: string,
    updates: Record<string, any>,
  ): Promise<UserSettings> {
    try {
      const existing = await this.getUserSettings(userId);
      const currentSettings = existing?.settings || {};

      const mergedSettings = {
        ...currentSettings,
        ...updates,
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(
          {
            user_id: userId,
            settings: mergedSettings,
          },
          {
            onConflict: "user_id",
          },
        )
        .select()
        .single();

      if (error) {
        throw this.normalizeError(error);
      }

      return data as UserSettings;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }
}

export const userSettingsService = new UserSettingsService();
