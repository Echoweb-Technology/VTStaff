/**
 * Get current position (expo-location style API using @react-native-community/geolocation).
 * Request permission first; returns { latitude, longitude } or throws.
 */

import { Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export async function getCurrentPositionAsync() {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => reject(new Error(err.message || 'Unable to get location')),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  });
}

/**
 * Request location permission (Android). iOS uses Info.plist usage description.
 * On Android you may need to use PermissionsAndroid before calling getCurrentPositionAsync.
 */
export async function requestLocationPermissionAsync() {
  if (Platform.OS !== 'android') return true;
  const { PermissionsAndroid } = require('react-native');
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
