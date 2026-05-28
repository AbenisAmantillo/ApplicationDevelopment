import { useRef } from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../auth/AuthContext';
import { ApiConfigBanner } from '../components/ApiConfigBanner';
import { ClientNotificationAlerts } from '../components/ClientNotificationAlerts';
import { LoadingView } from '../components/LoadingView';
import { isApiConfigured } from '../config/env';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';
import CheckoutScreen from '../screens/CheckoutScreen';
import StaffBlockedScreen from '../screens/StaffBlockedScreen';
import { ROUTES } from '../utils';
import { logScreenView } from '../utils/firebase';
import type { MainStackParamList } from './types';

const Stack = createStackNavigator<MainStackParamList>();

function MainStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={ROUTES.MAIN_TABS}
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ROUTES.CHECKOUT}
        component={CheckoutScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { isLoading, isAuthenticated, isStaffBlocked } = useAuth();
  const navigationRef =
    useNavigationContainerRef<Record<string, object | undefined>>();
  const routeNameRef = useRef<string | undefined>(undefined);

  const trackCurrentRoute = () => {
    const currentRouteName = navigationRef.getCurrentRoute()?.name;

    if (!currentRouteName || routeNameRef.current === currentRouteName) {
      return;
    }

    routeNameRef.current = currentRouteName;
    void logScreenView(currentRouteName);
  };

  if (!isApiConfigured()) {
    return <ApiConfigBanner />;
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1 }}>
        <LoadingView />
        <ActivityIndicator style={{ position: 'absolute', opacity: 0 }} />
      </View>
    );
  }

  return (
    <>
      {isAuthenticated && !isStaffBlocked ? <ClientNotificationAlerts /> : null}
      <NavigationContainer
        ref={navigationRef}
        onReady={trackCurrentRoute}
        onStateChange={trackCurrentRoute}>
        {isAuthenticated ? (
          isStaffBlocked ? <StaffBlockedScreen /> : <MainStack />
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
    </>
  );
}
