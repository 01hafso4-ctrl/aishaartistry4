import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B4513',
  secondary: '#D4A574',
  accent: '#C9A96E',
  background: '#FFF8F0',
  text: '#3D2914',
  white: '#FFFFFF',
  lightBg: '#FDF5ED',
  error: '#D32F2F',
};

interface Service {
  id: string;
  name: string;
  price: number;
}

interface Availability {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookScreen() {
  const params = useLocalSearchParams<{
    serviceId?: string;
    serviceName?: string;
    isCustom?: string;
  }>();

  const [services, setServices] = useState<Service[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(
    params.serviceId || null
  );
  const [isCustomQuote, setIsCustomQuote] = useState(params.isCustom === 'true');
  const [customDescription, setCustomDescription] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [locationType, setLocationType] = useState<'studio' | 'mobile'>('studio');
  const [locationAddress, setLocationAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, availabilityRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/services`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/availability`),
      ]);
      const servicesData = await servicesRes.json();
      const availabilityData = await availabilityRes.json();
      setServices(servicesData);
      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (!customerPhone.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return false;
    }
    if (!selectedService && !isCustomQuote) {
      Alert.alert('Error', 'Please select a service');
      return false;
    }
    if (isCustomQuote && !customDescription.trim()) {
      Alert.alert('Error', 'Please describe your custom design');
      return false;
    }
    if (!preferredDate.trim()) {
      Alert.alert('Error', 'Please enter your preferred date');
      return false;
    }
    if (!preferredTime.trim()) {
      Alert.alert('Error', 'Please enter your preferred time');
      return false;
    }
    if (locationType === 'mobile' && !locationAddress.trim()) {
      Alert.alert('Error', 'Please enter your address for mobile service');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const selectedServiceData = services.find((s) => s.id === selectedService);
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          service_id: selectedService,
          service_name: selectedServiceData?.name || params.serviceName || null,
          is_custom_quote: isCustomQuote,
          custom_description: isCustomQuote ? customDescription : null,
          preferred_date: preferredDate,
          preferred_time: preferredTime,
          location_type: locationType,
          location_address: locationType === 'mobile' ? locationAddress : null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Booking Request Sent!',
          'Thank you for your request. We will contact you shortly to confirm your appointment.',
          [{ text: 'OK', onPress: () => router.push('/') }]
        );
      } else {
        throw new Error('Failed to submit booking');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Book Appointment</Text>
            <Text style={styles.headerSubtitle}>
              Fill out the form below to request an appointment
            </Text>
          </View>

          {/* Availability Info */}
          <View style={styles.availabilitySection}>
            <Text style={styles.sectionTitle}>Our Availability</Text>
            <View style={styles.availabilityList}>
              {availability.map((avail) => (
                <View key={avail.day_of_week} style={styles.availabilityItem}>
                  <Text style={styles.dayName}>{dayNames[avail.day_of_week]}</Text>
                  <Text
                    style={[
                      styles.timeText,
                      !avail.is_available && styles.closedText,
                    ]}
                  >
                    {avail.is_available
                      ? `${avail.start_time} - ${avail.end_time}`
                      : 'Closed'}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Your Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={customerName}
                onChangeText={setCustomerName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Service Selection</Text>

            {/* Service Selection */}
            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  !isCustomQuote && styles.toggleButtonActive,
                ]}
                onPress={() => setIsCustomQuote(false)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    !isCustomQuote && styles.toggleTextActive,
                  ]}
                >
                  Select Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  isCustomQuote && styles.toggleButtonActive,
                ]}
                onPress={() => setIsCustomQuote(true)}
              >
                <Text
                  style={[
                    styles.toggleText,
                    isCustomQuote && styles.toggleTextActive,
                  ]}
                >
                  Custom Quote
                </Text>
              </TouchableOpacity>
            </View>

            {!isCustomQuote ? (
              <View style={styles.servicesGrid}>
                {services
                  .filter((s) => s.price > 0)
                  .map((service) => (
                    <TouchableOpacity
                      key={service.id}
                      style={[
                        styles.serviceOption,
                        selectedService === service.id &&
                          styles.serviceOptionSelected,
                      ]}
                      onPress={() => setSelectedService(service.id)}
                    >
                      <Text
                        style={[
                          styles.serviceOptionName,
                          selectedService === service.id &&
                            styles.serviceOptionNameSelected,
                        ]}
                      >
                        {service.name}
                      </Text>
                      <Text
                        style={[
                          styles.serviceOptionPrice,
                          selectedService === service.id &&
                            styles.serviceOptionPriceSelected,
                        ]}
                      >
                        ${service.price}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Describe Your Design *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about your custom design idea..."
                  value={customDescription}
                  onChangeText={setCustomDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Date & Time</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Date *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., July 15, 2025"
                value={preferredDate}
                onChangeText={setPreferredDate}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Preferred Time *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2:00 PM"
                value={preferredTime}
                onChangeText={setPreferredTime}
                placeholderTextColor="#999"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Location</Text>

            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  locationType === 'studio' && styles.toggleButtonActive,
                ]}
                onPress={() => setLocationType('studio')}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={locationType === 'studio' ? COLORS.white : COLORS.text}
                />
                <Text
                  style={[
                    styles.toggleText,
                    locationType === 'studio' && styles.toggleTextActive,
                  ]}
                >
                  Studio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  locationType === 'mobile' && styles.toggleButtonActive,
                ]}
                onPress={() => setLocationType('mobile')}
              >
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={locationType === 'mobile' ? COLORS.white : COLORS.text}
                />
                <Text
                  style={[
                    styles.toggleText,
                    locationType === 'mobile' && styles.toggleTextActive,
                  ]}
                >
                  Mobile
                </Text>
              </TouchableOpacity>
            </View>

            {locationType === 'mobile' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Address *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your complete address"
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                <Text style={styles.noteText}>
                  Note: Mobile service may have additional travel charges
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any special requests or information..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>
                    {isCustomQuote ? 'Request Quote' : 'Request Booking'}
                  </Text>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              * We will contact you to confirm your appointment within 24 hours
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#666',
  },
  availabilitySection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  availabilityList: {
    gap: 8,
  },
  availabilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  closedText: {
    color: '#999',
  },
  formSection: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBg,
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  toggleButtonActive: {
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  servicesGrid: {
    gap: 10,
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  serviceOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  serviceOptionName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
  },
  serviceOptionNameSelected: {
    color: COLORS.primary,
  },
  serviceOptionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  serviceOptionPriceSelected: {
    color: COLORS.primary,
  },
  noteText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
    fontStyle: 'italic',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  disclaimer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});
