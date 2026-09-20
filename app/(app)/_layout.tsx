/**
 * App Layout — app/(app)/_layout.tsx
 *
 * Layout for all protected screens.
 * Redirects to (auth)/login if the user is NOT authenticated.
 *
 * Bottom tab navigator with 5 tabs:
 *   Home (index)    — Dashboard / metrics / recent activity
 *   My Issues       — User's submitted issues list & search
 *   Report          — Central action to file grievance (form or chatbot)
 *   Notifications   — Alerts & status updates
 *   Profile         — User profile & dev settings
 */

import { Tabs, Redirect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, selectIsAuthenticated } from '@/store/auth.store';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

export default function AppLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray400,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="issues/index"
        options={{
          title: 'My Issues',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'file-tray-full' : 'file-tray-full-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.reportIconCircle, focused && styles.reportIconCircleActive]}>
              <Ionicons name="add" size={26} color={COLORS.white} />
            </View>
          ),
          tabBarLabel: () => null, // Hidden label for prominent center action button
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons
              name={focused ? 'notifications' : 'notifications-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
        }}
      />

      {/* Hidden nested screens — accessible via router.push() */}
      <Tabs.Screen name="issues/[id]" options={{ href: null }} />
      <Tabs.Screen name="report/form" options={{ href: null }} />
      <Tabs.Screen name="report/chatbot" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.gray200,
    borderTopWidth: 1,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
    height: 62,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  tabBarLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    marginTop: 2,
  },
  reportIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  reportIconCircleActive: {
    backgroundColor: COLORS.primaryLight,
  },
});
