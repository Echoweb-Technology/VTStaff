/**
 * VT Staff - React Native CLI (no Expo)
 * Navigation: Login -> OTP -> Home
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screens/LoginScreen';
import OTPScreen from './src/screens/OTPScreen';
import HomeScreen from './src/screens/HomeScreen';
import StartDutyScreen from './src/screens/StartDutyScreen';
import EndDutyScreen from './src/screens/EndDutyScreen';
import AddFuelScreen from './src/screens/AddFuelScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    async function checkToken() {
      try {
        const token = await AsyncStorage.getItem('@vtstaff_jwt_token');
        if (token) {
          setInitialRoute('Home');
        }
      } catch (error) {
        console.error('Failed to parse token on startup', error);
      } finally {
        setIsLoading(false);
      }
    }
    checkToken();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#34C759" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRoute}
          screenOptions={{
            headerStyle: { backgroundColor: '#f5f5f5' },
            headerTitleStyle: { fontWeight: '600', color: '#333' },
          }}
        >
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Login' }}
          />
          <Stack.Screen
            name="OTP"
            component={OTPScreen}
            options={{ title: 'Verify OTP' }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="StartDuty"
            component={StartDutyScreen}
            options={{ title: 'Start Duty' }}
          />
          <Stack.Screen
            name="EndDuty"
            component={EndDutyScreen}
            options={{ title: 'End Duty' }}
          />
          <Stack.Screen
            name="AddFuel"
            component={AddFuelScreen}
            options={{ title: 'Add Fuel / ईंधन भरें' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
