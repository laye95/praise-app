import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const envSupabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

function getSupabaseUrl(): string {
  if (!envSupabaseUrl) {
    throw new Error(
      "Missing EXPO_PUBLIC_SUPABASE_URL. Please check your .env file.",
    );
  }
  const isLocalUrl =
    envSupabaseUrl.includes("127.0.0.1") || envSupabaseUrl.includes("localhost");
  if (
    typeof __DEV__ !== "undefined" &&
    __DEV__ &&
    isLocalUrl &&
    Platform.OS !== "web"
  ) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.replace(/^exp:\/\//, "").split(":")[0];
      if (host && host !== "127.0.0.1" && host !== "localhost") {
        try {
          const url = new URL(envSupabaseUrl);
          url.hostname = host;
          return url.toString().replace(/\/$/, "");
        } catch {
          return envSupabaseUrl;
        }
      }
    }
  }
  return envSupabaseUrl;
}

const supabaseUrl = getSupabaseUrl();

if (!supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_ANON_KEY. Please check your .env file.",
  );
}

class ExpoSecureStoreAdapter {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  }

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  }

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new ExpoSecureStoreAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
