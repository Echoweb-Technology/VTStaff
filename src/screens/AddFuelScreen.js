import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    ScrollView,
} from 'react-native';
import AwesomeAlert from 'react-native-awesome-alerts';
import { pickImageFromCamera, compressImageHeavy } from '../utils/imagePicker';
import { addFuel } from '../services/driverApi';

export default function AddFuelScreen({ route, navigation }) {
    const {
        bookingId = '',
        vehicleRegistration = '',
        vehicleFuelType = '',
        prevOdometerReading = 0,
    } = route.params || {};

    const todayDate = new Date().toISOString().split('T')[0];

    const [fuelType, setFuelType] = useState('');
    const [odometer, setOdometer] = useState('');
    const [quantity, setQuantity] = useState('');

    const [meterPhotoUri, setMeterPhotoUri] = useState(null);
    const [pumpPhotoUri, setPumpPhotoUri] = useState(null);
    const [slipPhotoUri, setSlipPhotoUri] = useState(null);

    const [submitting, setSubmitting] = useState(false);

    // AwesomeAlert state
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        title: '',
        message: '',
        showCancel: false,
        confirmText: 'OK / ठीक है',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, show: false })),
    });

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, show: false }));

    const showAlert = (config) => {
        setAlertConfig({
            show: true,
            title: config.title || '',
            message: config.message || '',
            showCancel: config.showCancel || false,
            confirmText: config.confirmText || 'OK / ठीक है',
            onConfirm: config.onConfirm || hideAlert,
        });
    };

    // Initialize fixed fuel types
    React.useEffect(() => {
        if (vehicleFuelType && !['CNG/Petrol', 'Petrol/CNG', 'CNG', 'Petrol'].includes(vehicleFuelType)) {
            setFuelType(vehicleFuelType);
        }
    }, [vehicleFuelType]);

    const handleImagePick = async (setterFn) => {
        try {
            const result = await pickImageFromCamera();
            if (result?.uri) setterFn(result.uri);
        } catch (e) {
            showAlert({ title: 'Camera Error', message: e.message || 'Failed to get photo.' });
        }
    };

    const handleSubmit = async () => {
        const odo = parseFloat(odometer);
        const qty = parseFloat(quantity);

        if (!vehicleRegistration) {
            showAlert({ title: 'Error', message: 'Missing vehicle registration data.' });
            return;
        }
        if (!fuelType) {
            showAlert({ title: 'Required', message: 'Please select a fuel type.' });
            return;
        }
        if (!odometer || isNaN(odo)) {
            showAlert({ title: 'Required', message: 'Please enter a valid meter reading.' });
            return;
        }

        // PHP validation equivalent
        if (prevOdometerReading > 0) {
            if (odo > prevOdometerReading + 3000) {
                showAlert({ title: 'Invalid Reading', message: `Reading cannot be greater than ${prevOdometerReading + 3000}` });
                return;
            }
            if (odo < prevOdometerReading + 1) {
                showAlert({ title: 'Invalid Reading', message: `Reading must be at least ${prevOdometerReading + 1}` });
                return;
            }
        }

        if (!quantity || isNaN(qty) || qty <= 0) {
            showAlert({ title: 'Required', message: 'Please enter a valid quantity.' });
            return;
        }

        if (!meterPhotoUri) {
            showAlert({ title: 'Required', message: 'Please take Meter photo.' });
            return;
        }
        if (!pumpPhotoUri) {
            showAlert({ title: 'Required', message: 'Please take Pump photo.' });
            return;
        }
        if (fuelType !== 'Electric' && !slipPhotoUri) {
            showAlert({ title: 'Required', message: 'Please take Slip photo.' });
            return;
        }

        setSubmitting(true);
        try {
            // Compress images heavily
            const cMeter = await compressImageHeavy(meterPhotoUri);
            const cPump = await compressImageHeavy(pumpPhotoUri);
            let cSlip = null;
            if (slipPhotoUri) {
                cSlip = await compressImageHeavy(slipPhotoUri);
            }

            const formData = new FormData();
            formData.append('vehicle_no', vehicleRegistration);
            formData.append('txn_dt', todayDate);
            formData.append('fuel_type', fuelType);
            formData.append('booking_id', bookingId);
            formData.append('prev_odo_reading', prevOdometerReading);
            formData.append('current_odo_reading', String(odo));
            formData.append('qty', String(qty));

            formData.append('meter_photo', {
                uri: cMeter,
                type: 'image/jpeg',
                name: 'meter.jpg',
            });
            formData.append('dispenser_photo', {
                uri: cPump,
                type: 'image/jpeg',
                name: 'pump.jpg',
            });
            if (cSlip) {
                formData.append('slip_photo', {
                    uri: cSlip,
                    type: 'image/jpeg',
                    name: 'slip.jpg',
                });
            }

            const response = await addFuel(formData);

            // Access response data if needed
            // const avg = response?.data?.average;
            // const amt = response?.data?.amount;

            showAlert({
                title: 'Success / सफलता',
                message: 'Fuel entry submitted successfully. / ईंधन प्रविष्टि सफलतापूर्वक जमा हो गई।',
                onConfirm: () => {
                    hideAlert();
                    navigation.goBack();
                }
            });
        } catch (e) {
            showAlert({
                title: 'Error / त्रुटि',
                message: e.message || 'Failed to submit fuel entry. / ईंधन प्रविष्टि जमा करने में विफल।'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const showFuelDropdown = ['CNG/Petrol', 'Petrol/CNG', 'CNG', 'Petrol'].includes(vehicleFuelType);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Add Fuel / ईंधन भरें</Text>

            {/* Vehicle Info */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Vehicle Number</Text>
                <TextInput style={[styles.input, styles.readOnly]} value={vehicleRegistration} editable={false} />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Date</Text>
                <TextInput style={[styles.input, styles.readOnly]} value={todayDate} editable={false} />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Fuel Type</Text>
                {showFuelDropdown ? (
                    <View style={styles.dropdownContainer}>
                        <TouchableOpacity style={[styles.typeButton, fuelType === 'CNG' && styles.typeButtonActive]} onPress={() => setFuelType('CNG')}>
                            <Text style={[styles.typeButtonText, fuelType === 'CNG' && styles.typeButtonActiveText]}>CNG</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.typeButton, fuelType === 'Petrol' && styles.typeButtonActive]} onPress={() => setFuelType('Petrol')}>
                            <Text style={[styles.typeButtonText, fuelType === 'Petrol' && styles.typeButtonActiveText]}>Petrol</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TextInput style={[styles.input, styles.readOnly]} value={vehicleFuelType || 'Unknown'} editable={false} />
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Meter Reading / मीटर रीडिंग <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter current reading"
                    value={odometer}
                    onChangeText={setOdometer}
                    keyboardType="numeric"
                    editable={!submitting}
                />
                {prevOdometerReading > 0 && (
                    <Text style={styles.hint}>Prev: {prevOdometerReading} | Max: {prevOdometerReading + 3000}</Text>
                )}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Quantity / मात्रा <Text style={styles.required}>*</Text></Text>
                <TextInput
                    style={styles.input}
                    placeholder="Enter quantity"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    editable={!submitting}
                />
            </View>

            {/* Photos */}
            <View style={styles.formGroup}>
                <Text style={styles.label}>Meter Photo / मीटर फोटो <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.photoButton} onPress={() => handleImagePick(setMeterPhotoUri)} disabled={submitting}>
                    <Text style={styles.photoButtonText}>📷 {meterPhotoUri ? 'Retake Photo' : 'Take Photo / फोटो खींचे'}</Text>
                </TouchableOpacity>
                {meterPhotoUri ? <Image source={{ uri: meterPhotoUri }} style={styles.preview} resizeMode="contain" /> : null}
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Pump Photo / पंप फोटो <Text style={styles.required}>*</Text></Text>
                <TouchableOpacity style={styles.photoButton} onPress={() => handleImagePick(setPumpPhotoUri)} disabled={submitting}>
                    <Text style={styles.photoButtonText}>📷 {pumpPhotoUri ? 'Retake Photo' : 'Take Photo / फोटो खींचे'}</Text>
                </TouchableOpacity>
                {pumpPhotoUri ? <Image source={{ uri: pumpPhotoUri }} style={styles.preview} resizeMode="contain" /> : null}
            </View>

            {fuelType !== 'Electric' && (
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Slip Photo / स्लिप फोटो <Text style={styles.required}>*</Text></Text>
                    <TouchableOpacity style={styles.photoButton} onPress={() => handleImagePick(setSlipPhotoUri)} disabled={submitting}>
                        <Text style={styles.photoButtonText}>📷 {slipPhotoUri ? 'Retake Photo' : 'Take Photo / फोटो खींचे'}</Text>
                    </TouchableOpacity>
                    {slipPhotoUri ? <Image source={{ uri: slipPhotoUri }} style={styles.preview} resizeMode="contain" /> : null}
                </View>
            )}

            <TouchableOpacity style={[styles.submit, submitting && styles.submitDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit / जमा करें</Text>}
            </TouchableOpacity>

            <AwesomeAlert
                show={alertConfig.show}
                showProgress={false}
                title={alertConfig.title}
                message={alertConfig.message}
                closeOnTouchOutside={false}
                closeOnHardwareBackPress={false}
                showCancelButton={alertConfig.showCancel}
                showConfirmButton={true}
                cancelText="Cancel"
                confirmText={alertConfig.confirmText}
                confirmButtonColor="#34C759"
                cancelButtonColor="#FF3B30"
                onConfirmPressed={alertConfig.onConfirm}
                onCancelPressed={hideAlert}
                titleStyle={styles.alertTitle}
                messageStyle={styles.alertMessage}
                confirmButtonTextStyle={styles.alertButtonText}
                cancelButtonTextStyle={styles.alertButtonText}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    content: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 20 },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
    required: { color: 'red' },
    hint: { fontSize: 12, color: '#666', marginTop: 4 },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
    },
    readOnly: { backgroundColor: '#eaeaea', color: '#666' },
    dropdownContainer: { flexDirection: 'row', gap: 10 },
    typeButton: {
        flex: 1,
        padding: 12,
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    typeButtonActive: { backgroundColor: '#007AFF' },
    typeButtonText: { color: '#007AFF', fontWeight: 'bold' },
    typeButtonActiveText: { color: '#fff' },
    photoButton: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#90caf9',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 8,
    },
    photoButtonText: { color: '#1976d2', fontSize: 16, fontWeight: '600' },
    preview: { width: '100%', height: 150, borderRadius: 8, marginTop: 4 },
    submit: {
        backgroundColor: '#34C759',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitDisabled: { opacity: 0.7 },
    submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    alertTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    alertMessage: {
        fontSize: 16,
        color: '#555',
        textAlign: 'center',
        marginTop: 5,
        lineHeight: 22,
    },
    alertButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
