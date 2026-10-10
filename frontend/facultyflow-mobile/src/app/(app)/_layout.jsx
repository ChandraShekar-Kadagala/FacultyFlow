import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AppLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#2563EB",
                tabBarInactiveTintColor: "#94A3B8",
                tabBarStyle: {
                    height: 68,
                    paddingTop: 8,
                    paddingBottom: 10,
                    borderTopWidth: 1,
                    borderTopColor: "#E2E8F0",
                    backgroundColor: "#FFFFFF"
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600"
                }
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="home-outline"
                            size={size}
                            color={color}
                        />
                    )
                }}
            />

            <Tabs.Screen
                name="attendance"
                options={{
                    title: "Attendance",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="calendar-outline"
                            size={size}
                            color={color}
                        />
                    )
                }}
            />

            <Tabs.Screen
                name="verification"
                options={{
                    title: "Verify",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="shield-checkmark-outline"
                            size={size}
                            color={color}
                        />
                    )
                }}
            />

            <Tabs.Screen
                name="history"
                options={{
                    title: "History",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="time-outline"
                            size={size}
                            color={color}
                        />
                    )
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="person-outline"
                            size={size}
                            color={color}
                        />
                    )
                }}
            />
        </Tabs>
    );
}