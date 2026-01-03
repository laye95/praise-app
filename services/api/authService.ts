import {
  LoginData,
  RegisterChurchData,
  RegisterMemberData,
} from "@/types/auth";
import { BaseService } from "./baseService";
import { userSettingsService } from "./userSettingsService";
import { getCurrentLanguage } from "@/i18n";
import { permissionService } from "./permissionService";

export class AuthService extends BaseService {
  getSupabaseClient() {
    return this.supabase;
  }

  async login(data: LoginData) {
    try {
      this.log("info", "Attempting login", { email: data.email });

      const { data: authData, error } =
        await this.supabase.auth.signInWithPassword({
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });

      if (error) throw error;
      if (!authData.user) throw new Error("Login failed");

      this.log("info", "Login successful", { userId: authData.user.id });
      return authData;
    } catch (error) {
      this.log("error", "Login failed", error);
      throw this.normalizeError(error);
    }
  }

  async registerMember(data: RegisterMemberData) {
    try {
      this.log("info", "Registering member", { email: data.email });

      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email.trim().toLowerCase(),
        password: data.password,
        options: {
          data: {
            full_name: data.name,
          },
        },
      });

      if (error) throw error;
      if (!authData.user) throw new Error("Failed to create user");

      const userId = authData.user.id;

      try {
        const currentLanguage = getCurrentLanguage() as "en" | "nl";
        await userSettingsService.setSetting(userId, "language", currentLanguage);
        this.log("info", "Language preference saved", { userId, language: currentLanguage });
      } catch (langError) {
        this.log("warning", "Failed to save language preference", langError);
      }

      this.log("info", "Member registered successfully", {
        userId,
      });
      return authData;
    } catch (error) {
      this.log("error", "Member registration failed", error);
      throw this.normalizeError(error);
    }
  }

  async registerChurch(data: RegisterChurchData) {
    let userId: string | undefined;
    let isNewUser = false;

    try {
      this.log("info", "Starting church registration", { email: data.email });

      // Check if we're already authenticated
      const { data: sessionData } = await this.supabase.auth.getSession();

      if (sessionData.session?.user) {
        this.log("info", "User already authenticated, skipping signup");
        userId = sessionData.session.user.id;
      } else {
        // Try to sign up
        this.log("info", "Creating new auth user");
        const { data: authData, error: authError } =
          await this.supabase.auth.signUp({
            email: data.email.trim().toLowerCase(),
            password: data.password,
            options: {
              data: {
                full_name: data.name,
              },
            },
          });

        if (authError) {
          // If user already exists, try to sign in
          if (
            authError.message?.includes("already registered") ||
            authError.status === 422
          ) {
            this.log("info", "User exists, attempting sign in");
            const { data: signInData, error: signInError } =
              await this.supabase.auth.signInWithPassword({
                email: data.email.trim().toLowerCase(),
                password: data.password,
              });

            if (signInError) throw signInError;
            if (!signInData.user) throw new Error("Failed to sign in");

            userId = signInData.user.id;
          } else {
            throw authError;
          }
        } else {
          if (!authData.user) throw new Error("Failed to create user");
          userId = authData.user.id;
          isNewUser = true;
        }
      }

      // Create church
      this.log("info", "Creating church", { churchName: data.churchName });
      const { data: churchData, error: churchError } = await this.supabase
        .from("churches")
        .insert({
          name: data.churchName,
          denomination: data.denomination || null,
          location: data.location || null,
          timezone: data.timezone || "UTC",
        })
        .select()
        .single();

      if (churchError) {
        this.log("error", "Church creation failed", churchError);

        // If we just created the user, try to clean up
        if (isNewUser && userId) {
          await this.cleanupUser(userId);
        }

        throw churchError;
      }
      if (!churchData) throw new Error("Failed to create church");

      // Update user with church info
      this.log("info", "Updating user with church info", {
        userId,
        churchId: churchData.id,
      });
      const { error: updateError } = await this.supabase
        .from("users")
        .update({
          role: "church_admin",
          church_id: churchData.id,
        })
        .eq("id", userId);

      if (updateError) {
        this.log("error", "User update failed", updateError);
        throw updateError;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 200));
        
        const { data: rpcData, error: rpcError } = await this.supabase.rpc(
          "assign_pastor_role_to_user",
          {
            p_user_id: userId,
            p_church_id: churchData.id,
          }
        );

        if (rpcError) {
          this.log("error", "Failed to assign Pastor role via RPC", {
            error: rpcError,
            message: rpcError.message,
            code: rpcError.code,
            details: rpcError.details,
            hint: rpcError.hint,
            userId,
            churchId: churchData.id,
          });
          throw new Error(`Failed to assign Pastor role: ${rpcError.message || rpcError.code || 'Unknown error'}`);
        }

        this.log("info", "Pastor role RPC call completed", { 
          userId, 
          churchId: churchData.id,
          rpcData 
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const { data: verifyRole, error: verifyError } = await this.supabase
          .from("user_church_roles")
          .select("id, church_role_id")
          .eq("user_id", userId)
          .limit(1);

        if (verifyError) {
          this.log("warning", "Could not verify role assignment", verifyError);
        } else if (!verifyRole || verifyRole.length === 0) {
          this.log("error", "Role assignment verification failed - no role found", {
            userId,
            churchId: churchData.id,
          });
          throw new Error("Pastor role was not assigned - verification failed");
        } else {
          this.log("info", "Pastor role verified in database", {
            userId,
            churchId: churchData.id,
            roleId: verifyRole[0].church_role_id,
          });
        }
      } catch (roleAssignError) {
        this.log("error", "Failed to assign Pastor role", {
          error: roleAssignError,
          userId,
          churchId: churchData.id,
        });
        throw roleAssignError;
      }

      try {
        const currentLanguage = getCurrentLanguage() as "en" | "nl";
        await userSettingsService.setSetting(userId, "language", currentLanguage);
        this.log("info", "Language preference saved", { userId, language: currentLanguage });
      } catch (langError) {
        this.log("warning", "Failed to save language preference", langError);
      }

      this.log("info", "Church registration completed successfully");
      return { user: { id: userId }, church: churchData };
    } catch (error) {
      this.log("error", "Church registration failed", error);
      throw this.normalizeError(error);
    }
  }

  async signOut() {
    try {
      this.log("info", "Signing out");
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
      this.log("info", "Sign out successful");
    } catch (error) {
      this.log("error", "Sign out failed", error);
      throw this.normalizeError(error);
    }
  }

  private async cleanupUser(userId: string) {
    try {
      this.log("warn", "Cleaning up user after failed registration", {
        userId,
      });

      await this.supabase.from("users").delete().eq("id", userId);
      await this.supabase.auth.signOut();

      this.log("info", "User cleanup completed");
    } catch (cleanupError) {
      this.log("error", "Failed to cleanup user", cleanupError);
    }
  }
}

export const authService = new AuthService();
