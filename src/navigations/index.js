import { createStackNavigator } from '@react-navigation/stack';

// screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Login from '../screens/auth/Login';

// utils
import { NavigationContainer } from '@react-navigation/native';
import { ROUTES } from '../utils';

const Stack = createStackNavigator();

const MainNavigation = () => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.LOGIN}>
      <Stack.Screen name={ROUTES.LOGIN} component={Login} />
      <Stack.Screen name={ROUTES.HOME} component={HomeScreen} />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default () => {
  return (
    <NavigationContainer>
      <MainNavigation />
    </NavigationContainer>
  );
};