import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_STORAGE_KEY = "blog-escola-x.auth-token";
let webToken: string | null = null;

export async function getStoredToken() {
  if (Platform.OS === "web") {
    return webToken;
  }

  return SecureStore.getItemAsync(TOKEN_STORAGE_KEY);
}

export async function storeToken(token: string) {
  if (Platform.OS === "web") {
    webToken = token;
    return;
  }

  await SecureStore.setItemAsync(TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken() {
  if (Platform.OS === "web") {
    webToken = null;
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_STORAGE_KEY);
}
