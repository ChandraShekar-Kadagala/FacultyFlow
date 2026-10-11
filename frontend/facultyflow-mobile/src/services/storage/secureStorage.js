import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const TOKEN_KEY = "facultyflow_access_token";
const USER_KEY = "facultyflow_user_profile";

/**
 * Checks whether hardware-backed SecureStore is supported on the current device platform.
 * Web and certain test harnesses fallback to AsyncStorage.
 */
let isSecureStoreAvailable = null;

async function checkSecureStoreAvailability() {
    if (isSecureStoreAvailable !== null) {
        return isSecureStoreAvailable;
    }

    try {
        if (Platform.OS === "web") {
            isSecureStoreAvailable = false;
            return false;
        }

        const available = await SecureStore.isAvailableAsync();
        isSecureStoreAvailable = Boolean(available);
        return isSecureStoreAvailable;
    } catch (_err) {
        isSecureStoreAvailable = false;
        return false;
    }
}

/**
 * Persists the sensitive authentication JWT token into hardware-backed keychain / keystore.
 */
export async function saveAuthToken(token) {
    if (!token) return;

    const useSecure = await checkSecureStoreAvailability();
    if (useSecure) {
        await SecureStore.setItemAsync(TOKEN_KEY, token, {
            keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
        });
    } else {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    }
}

/**
 * Retrieves the persisted JWT token.
 */
export async function getAuthToken() {
    const useSecure = await checkSecureStoreAvailability();
    if (useSecure) {
        return SecureStore.getItemAsync(TOKEN_KEY);
    }
    return AsyncStorage.getItem(TOKEN_KEY);
}

/**
 * Removes the authentication JWT token.
 */
export async function removeAuthToken() {
    const useSecure = await checkSecureStoreAvailability();
    if (useSecure) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
    } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
    }
}

/**
 * Persists the non-sensitive faculty user profile metadata.
 */
export async function saveUserSession(user) {
    if (!user) return;
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Retrieves the persisted faculty user profile.
 */
export async function getUserSession() {
    try {
        const raw = await AsyncStorage.getItem(USER_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (_err) {
        return null;
    }
}

/**
 * Removes the persisted user profile.
 */
export async function removeUserSession() {
    await AsyncStorage.removeItem(USER_KEY);
}

/**
 * Completely clears all session tokens and user data on logout.
 */
export async function clearSession() {
    await Promise.all([
        removeAuthToken(),
        removeUserSession()
    ]);
}

/**
 * Checks if a session exists without loading heavy data.
 */
export async function hasAuthSession() {
    const token = await getAuthToken();
    return Boolean(token && token.trim().length > 0);
}

export default {
    saveAuthToken,
    getAuthToken,
    removeAuthToken,
    saveUserSession,
    getUserSession,
    removeUserSession,
    clearSession,
    hasAuthSession
};
