import { createStackNavigator } from '@react-navigation/stack';
import { ROUTES } from '../utils';

// screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createStackNavigator();

interface MainNavigationProps {
  setIsLoggedIn?: (value: boolean) => void;
}

const MainNavigation = ({ setIsLoggedIn }: MainNavigationProps) => {
  return (
    <Stack.Navigator initialRouteName={ROUTES.HOME}>
      <Stack.Screen 
        name={ROUTES.HOME} 
        component={HomeScreen}
        initialParams={{ setIsLoggedIn }}
      />
      <Stack.Screen name={ROUTES.PROFILE} component={ProfileScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigation;
