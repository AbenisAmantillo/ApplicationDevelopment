import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { Platform, StatusBar, useColorScheme } from 'react-native';
import { useSelector } from 'react-redux';

import AuthNav from './AuthNav';
import MainNav from './MainNav';

export default () => {
  const isDarkMode = useColorScheme() === 'dark';
  const auth = useSelector((state: any) => state.auth);
  const isLoggedIn = !!auth?.data;

  useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, [isDarkMode]);

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainNav setIsLoggedIn={undefined} /> : <AuthNav setIsLoggedIn={undefined} />}
    </NavigationContainer>
  );
};
