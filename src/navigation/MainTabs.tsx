import { createStackNavigator } from '@react-navigation/stack';

import DashboardScreen from '../screens/DashboardScreen';
import MyTransactionsScreen from '../screens/MyTransactionsScreen';
import PaymentScreen from '../screens/PaymentScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ROUTES } from '../utils';
import type { MainTabParamList } from './types';

const Stack = createStackNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name={ROUTES.DASHBOARD} component={DashboardScreen} />
      <Stack.Screen
        name={ROUTES.MY_TRANSACTIONS}
        component={MyTransactionsScreen}
      />
      <Stack.Screen name={ROUTES.PAYMENT} component={PaymentScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Stack.Navigator>
  );
}
