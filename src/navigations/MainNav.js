import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Login from '../screens/auth/Login';
import { ROUTES } from '../utils';

const Stack = createStackNavigator();

export default function MainNavigation() {
    return (
        <Stack.Navigator 
        initialRouteName={ROUTES.LOGIN}
        screenOptions={{
            headerStyle: {
            backgroundColor: '#fff',
            },
            headerTintColor: '#000',
            headerTitleStyle: {
            fontWeight: 'bold',
            },
        }}
        >
        <Stack.Screen 
            name={ROUTES.LOGIN} 
            component={Login}
            options={{ title: 'Login' }}
        />
        <Stack.Screen 
            name={ROUTES.HOME} 
            component={HomeScreen}
            options={{ title: 'Home' }}
        />
        <Stack.Screen 
            name={ROUTES.PROFILE} 
            component={ProfileScreen}
            options={{ title: 'Profile' }}
        />
        </Stack.Navigator>
    );
}