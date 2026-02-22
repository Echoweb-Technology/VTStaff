/**
 * Start Duty – form: odometer reading, meter photo. Submits to POST start-duty.php
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { startDuty } from '../services/driverApi';
import { pickImageFromCamera, pickImageFromGallery, resizeImage } from '../utils/imagePicker';

export default function StartDutyScreen({ route, navigation }) {
  const {
    bookingId = '',
    userName = '',
    userPhoneNo = '',
    startLatitude = '',
    startLongitude = '',
  } = route.params || {};

  const [odometer, setOdometer] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImagePick = async (pickerFn) => {
    try {
      const result = await pickerFn();
      if (result?.uri) setPhotoUri(result.uri);
    } catch (e) {
      Alert.alert('Camera', e.message || 'Failed to get photo.');
    }
  };

  const showImageOptions = () => {
    const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
    const cancelIndex = 2;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (i) => {
          if (i === 0) {
            await handleImagePick(pickImageFromCamera);
          } else if (i === 1) {
            await handleImagePick(pickImageFromGallery);
          }
        }
      );
    } else {
      Alert.alert('Meter photo', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: async () => {
          await handleImagePick(pickImageFromCamera);
        }},
        { text: 'Choose from Gallery', onPress: async () => {
          await handleImagePick(pickImageFromGallery);
        }},
      ]);
    }
  };

  const handleSubmit = async () => {
    const odo = odometer.trim();
    if (!odo) {
      Alert.alert('Required', 'Please enter odometer reading.');
      return;
    }
    if (!photoUri) {
      Alert.alert('Required', 'Please add odometer photo.');
      return;
    }
    setSubmitting(true);
    try {
      const resizedUri = await resizeImage(photoUri);
      const formData = new FormData();
      formData.append('odometer_reading', odo);
      formData.append('booking_id', bookingId);
      formData.append('user_name', userName);
      formData.append('user_phone_no', userPhoneNo);
      formData.append('start_latitude', startLatitude);
      formData.append('start_longitude', startLongitude);
      formData.append('odometer_photo', {
        uri: resizedUri,
        name: 'odometer.jpg',
        type: 'image/jpeg',
      });
      await startDuty(formData);
      Alert.alert('Success', 'Duty started successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to start duty.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start Duty</Text>
      {bookingId ? (
        <View style={styles.info}>
          <Text style={styles.infoText}>Booking: {bookingId}</Text>
          <Text style={styles.infoText}>User: {userName}</Text>
        </View>
      ) : null}

      <Text style={styles.label}>Odometer reading</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter reading"
        placeholderTextColor="#999"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="numeric"
        editable={!submitting}
      />

      <Text style={styles.label}>Odometer photo</Text>
      <TouchableOpacity style={styles.photoButton} onPress={showImageOptions} disabled={submitting}>
        <Text style={styles.photoButtonText}>{photoUri ? 'Change photo' : 'Take / Select photo'}</Text>
      </TouchableOpacity>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
      ) : null}

      <TouchableOpacity
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit & Start Duty</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16 },
  info: { marginBottom: 20 },
  infoText: { fontSize: 14, color: '#555', marginBottom: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#34C759',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20 },
  submit: {
    backgroundColor: '#34C759',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
