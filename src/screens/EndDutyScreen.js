/**
 * End Duty – form: odometer reading, end photo. Submits to POST end-duty.php
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
import { endDuty } from '../services/driverApi';
import { pickImageFromCamera, pickImageFromGallery, resizeImage } from '../utils/imagePicker';

export default function EndDutyScreen({ route, navigation }) {
  const { endLatitude = '', endLongitude = '' } = route.params || {};

  const [odometer, setOdometer] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showImageOptions = () => {
    const options = ['Take Photo', 'Choose from Gallery', 'Cancel'];
    const cancelIndex = 2;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: cancelIndex },
        async (i) => {
          if (i === 0) {
            const result = await pickImageFromCamera();
            if (result?.uri) setPhotoUri(result.uri);
          } else if (i === 1) {
            const result = await pickImageFromGallery();
            if (result?.uri) setPhotoUri(result.uri);
          }
        }
      );
    } else {
      Alert.alert('End odometer photo', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: async () => {
          const result = await pickImageFromCamera();
          if (result?.uri) setPhotoUri(result.uri);
        }},
        { text: 'Choose from Gallery', onPress: async () => {
          const result = await pickImageFromGallery();
          if (result?.uri) setPhotoUri(result.uri);
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
      Alert.alert('Required', 'Please add end odometer photo.');
      return;
    }
    setSubmitting(true);
    try {
      const resizedUri = await resizeImage(photoUri);
      const formData = new FormData();
      formData.append('odometer_reading', odo);
      formData.append('end_latitude', endLatitude);
      formData.append('end_longitude', endLongitude);
      formData.append('end_odometer_photo', {
        uri: resizedUri,
        name: 'end_odometer.jpg',
        type: 'image/jpeg',
      });
      await endDuty(formData);
      Alert.alert('Success', 'Duty ended successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', e.message || 'Failed to end duty.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>End Duty</Text>

      <Text style={styles.label}>End odometer reading</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter reading"
        placeholderTextColor="#999"
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="numeric"
        editable={!submitting}
      />

      <Text style={styles.label}>End odometer photo</Text>
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
          <Text style={styles.submitText}>Submit & End Duty</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20 },
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
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  photoButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20 },
  submit: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
