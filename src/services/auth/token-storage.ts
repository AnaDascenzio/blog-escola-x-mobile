import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_STORAGE_KEY = "blog-escola-x.auth-token";
let webTokenFallback: string | null = null;

export async function getStoredToken() {
  if (Platform.OS === "web") {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? webTokenFallback;
      }
    } catch {
      // LocalStorage desativado ou bloqueado por política de cookies
    }
    return webTokenFallback;
  }

  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

export async function storeToken(token: string) {
  if (Platform.OS === "web") {
    webTokenFallback = token;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } catch {
      // ignore
    }
    return;
  }

  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken() {
  if (Platform.OS === "web") {
    webTokenFallback = null;
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}
