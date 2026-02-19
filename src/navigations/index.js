// utils
import { NavigationContainer } from '@react-navigation/native';
import { useState, useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';

import AuthNav from './AuthNav';
import MainNav from './MainNav';

export default () => {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [isDarkMode]);

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <MainNav setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <AuthNav setIsLoggedIn={setIsLoggedIn} />
      )}
    </NavigationContainer>
  );
};