import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../utils';

// screens
import Login from '../screens/auth/Login';
import Register from '../screens/auth/Register';

const Stack = createStackNavigator();

interface AuthNavigationProps {
  setIsLoggedIn?: (value: boolean) => void;
}

const AuthNavigation = ({ setIsLoggedIn }: AuthNavigationProps) => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.LOGIN}>
      <Stack.Screen
        name={ROUTES.LOGIN}
        component={Login}
        initialParams={{ setIsLoggedIn }}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name={ROUTES.REGISTER} component={Register} />
    </Stack.Navigator>
  );
};

export default AuthNavigation;
