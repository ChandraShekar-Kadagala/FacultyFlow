import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "../context/AuthContext";
import {
    AttendanceProvider
} from "../context/AttendanceContext";

export default function RootLayout() {
    return (
        <AuthProvider>
            <AttendanceProvider>

                <StatusBar style="dark" />

                <Stack
                    screenOptions={{
                        headerShown: false
                    }}
                />

            </AttendanceProvider>
        </AuthProvider>
    );
}