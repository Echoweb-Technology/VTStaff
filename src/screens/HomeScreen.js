/**
 * Home / Duty Screen – fetches driver status and shows Start Duty / End Duty.
 * Uses https://vtms.co.in/api/supervisor/driver/status.php
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { getDriverStatus } from '../services/driverApi';
import { requestLocationPermissionAsync, getCurrentPositionAsync } from '../utils/location';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const bottomNavHeight = 56;
  const bottomPadding = Math.max(insets.bottom, 8);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await getDriverStatus();
      const data = res.data ?? res;
      setStatus(data);
    } catch (e) {
      setError(e.message || 'Failed to load status');
      setStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStatus();
    }, [fetchStatus])
  );

  const onRefresh = () => fetchStatus(true);

  const dutyStatus = status?.duty_status ?? 'off_duty';
  const hasVehicle = status?.has_vehicle ?? false;
  const booking = status?.booking ?? null;
  const duration = status?.duration ?? 0;
  const vehicleDetails = status?.vehicle_details ?? null;

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0h 0m';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const handleStartDuty = () => {
    if (!hasVehicle) {
      Alert.alert('Cannot start duty', 'No vehicle assigned. Please contact supervisor.');
      return;
    }
    if (!booking?.booking_id) {
      Alert.alert('No Duty Assigned!', 'You do not have a booking assigned. Please contact supervisor.');
      return;
    }
    Alert.alert(
      'Start Duty',
      'Are you sure you want to start duty? You will need to enter odometer reading and take a photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Start',
          onPress: async () => {
            try {
              const hasPermission = await requestLocationPermissionAsync();
              if (!hasPermission) {
                throw new Error('Location permission denied. Please allow location access from app settings.');
              }
              const coords = await getCurrentPositionAsync();
              navigation.navigate('StartDuty', {
                bookingId: booking.booking_id,
                userName: booking.user_name || '',
                userPhoneNo: String(booking.user_phone ?? ''),
                startLatitude: String(coords.latitude),
                startLongitude: String(coords.longitude),
              });
            } catch (e) {
              Alert.alert('Location required', e.message || 'Please enable location and try again.');
            }
          },
        },
      ]
    );
  };

  const handleEndDuty = () => {
    Alert.alert(
      'End Duty',
      'Are you sure you want to end duty? You will need to enter end odometer reading and take a photo.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, End',
          onPress: async () => {
            try {
              const hasPermission = await requestLocationPermissionAsync();
              if (!hasPermission) {
                throw new Error('Location permission denied. Please allow location access from app settings.');
              }
              const coords = await getCurrentPositionAsync();
              navigation.navigate('EndDuty', {
                endLatitude: String(coords.latitude),
                endLongitude: String(coords.longitude),
              });
            } catch (e) {
              Alert.alert('Location required', e.message || 'Please enable location and try again.');
            }
          },
        },
      ]
    );
  };

  if (loading && !status) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#34C759" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>VT</Text>
        </View>
        <TouchableOpacity style={styles.menuButton} activeOpacity={0.7}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: bottomNavHeight + bottomPadding + 12 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#34C759']} />
        }
      >
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.bannerCard}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/102104/pexels-photo-102104.jpeg?auto=compress&cs=tinysrgb&w=800',
            }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerDots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>

        {/* Booking details */}
        {booking && (
          <View style={styles.bookingCard}>
            <Text style={styles.bookingTitle}>Booking</Text>
            <Text style={styles.bookingRow}>ID: {booking.booking_id}</Text>
            <Text style={styles.bookingRow}>User: {booking.user_name || '–'}</Text>
            <Text style={styles.bookingRow}>Phone: {booking.user_phone ?? '–'}</Text>
            {vehicleDetails?.registration && (
              <Text style={styles.bookingRow}>Vehicle: {vehicleDetails.registration}</Text>
            )}
          </View>
        )}

        {/* Start / End duty buttons */}
        <View style={styles.dutyRow}>
          <TouchableOpacity
            style={[
              styles.dutyButton,
              styles.startDuty,
              (dutyStatus === 'on_duty' || !hasVehicle) && styles.dutyButtonDisabled,
            ]}
            onPress={handleStartDuty}
            disabled={dutyStatus === 'on_duty' || !hasVehicle}
            activeOpacity={0.8}
          >
            <Text style={styles.dutyText}>Start Duty</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.dutyButton,
              styles.endDuty,
              dutyStatus === 'off_duty' && styles.dutyButtonDisabled,
            ]}
            onPress={handleEndDuty}
            disabled={dutyStatus === 'off_duty'}
            activeOpacity={0.8}
          >
            <Text style={styles.dutyText}>End Duty</Text>
          </TouchableOpacity>
        </View>

        {!hasVehicle && dutyStatus === 'off_duty' && (
          <Text style={styles.hintText}>No vehicle assigned. Start duty is disabled.</Text>
        )}
        {dutyStatus === 'on_duty' && (
          <Text style={styles.durationText}>On duty: {formatDuration(duration)}</Text>
        )}

        <TouchableOpacity style={styles.card} activeOpacity={0.85}>
          <View style={styles.cardIconCircle}>
            <Text style={styles.cardIconText}>⛽</Text>
          </View>
          <Text style={styles.cardTitle}>Add Fuel</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[styles.bottomNav, { paddingBottom: bottomPadding }]}>
        <View style={styles.bottomNavInner}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Text style={[styles.navIcon, styles.navIconActive]}>⌂</Text>
            <Text style={[styles.navLabel, styles.navLabelActive]}>HOME</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Text style={styles.navIcon}>⚙</Text>
            <Text style={styles.navLabel}>SETTINGS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e53935',
  },
  menuButton: {
    width: 28,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingVertical: 6,
  },
  menuLine: {
    height: 2,
    backgroundColor: '#333',
    borderRadius: 1,
    width: 22,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  bannerCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#ddd',
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 180,
  },
  bannerDots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffb300',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  bookingRow: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  dutyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dutyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dutyButtonDisabled: {
    opacity: 0.5,
  },
  startDuty: {
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  endDuty: {
    backgroundColor: '#FF3B30',
    marginLeft: 8,
  },
  dutyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  durationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  cardIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIconText: {
    fontSize: 24,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
  },
  bottomNavInner: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 18,
    color: '#999999',
    marginBottom: 2,
  },
  navIconActive: {
    color: '#007AFF',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: '#999999',
  },
  navLabelActive: {
    color: '#007AFF',
  },
});
