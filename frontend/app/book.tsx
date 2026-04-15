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
import { Calendar } from 'react-native-calendars';

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

const timeSlots = [
  '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30',
];

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

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedService, setSelectedService] = useState<string | null>(
    params.serviceId || null
  );
  const [isCustomQuote, setIsCustomQuote] = useState(params.isCustom === 'true');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
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

  // Build disabled dates map based on availability
  const getDisabledDays = () => {
    const unavailableDays = availability
      .filter((a) => !a.is_available)
      .map((a) => a.day_of_week);
    return unavailableDays;
  };

  const isDayAvailable = (dateString: string) => {
    const date = new Date(dateString + 'T12:00:00');
    const dayOfWeek = date.getDay(); // 0=Sunday
    const avail = availability.find((a) => a.day_of_week === dayOfWeek);
    return avail ? avail.is_available : false;
  };

  // Generate marked dates for the next 90 days
  const getMarkedDates = () => {
    const marked: Record<string, any> = {};
    const today = new Date();

    for (let i = 0; i < 90; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      if (!isDayAvailable(dateString)) {
        marked[dateString] = {
          disabled: true,
          disableTouchEvent: true,
        };
      }
    }

    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: COLORS.primary,
        disableTouchEvent: false,
        disabled: false,
      };
    }

    return marked;
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return [];
    const date = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const avail = availability.find((a) => a.day_of_week === dayOfWeek);

    if (!avail || !avail.is_available) return [];

    const startHour = parseInt(avail.start_time.split(':')[0]);
    const endHour = parseInt(avail.end_time.split(':')[0]);

    return timeSlots.filter((slot) => {
      const slotHour = parseInt(slot.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
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
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date');
      return false;
    }
    if (!selectedTime) {
      Alert.alert('Error', 'Please select a time');
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
      const formattedDate = new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric',
      });

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          service_id: selectedService,
          service_name: selectedServiceData?.name || params.serviceName || null,
          is_custom_quote: isCustomQuote,
          custom_description: isCustomQuote ? customDescription : null,
          preferred_date: formattedDate,
          preferred_time: selectedTime,
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

  const availableSlots = getAvailableTimeSlots();

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
              Pick a date, time, and service to request an appointment
            </Text>
          </View>

          {/* Calendar */}
          <View style={styles.calendarSection}>
            <Text style={styles.sectionTitle}>Select Date</Text>
            <Calendar
              onDayPress={(day: any) => {
                if (isDayAvailable(day.dateString)) {
                  setSelectedDate(day.dateString);
                  setSelectedTime('');
                }
              }}
              markedDates={getMarkedDates()}
              minDate={new Date().toISOString().split('T')[0]}
              theme={{
                backgroundColor: COLORS.white,
                calendarBackground: COLORS.white,
                textSectionTitleColor: COLORS.text,
                selectedDayBackgroundColor: COLORS.primary,
                selectedDayTextColor: COLORS.white,
                todayTextColor: COLORS.primary,
                dayTextColor: COLORS.text,
                textDisabledColor: '#ccc',
                arrowColor: COLORS.primary,
                monthTextColor: COLORS.text,
                textMonthFontWeight: 'bold',
                textDayFontSize: 15,
                textMonthFontSize: 17,
              }}
              style={styles.calendar}
            />
            {selectedDate ? (
              <View style={styles.selectedDateBanner}>
                <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
                <Text style={styles.selectedDateText}>
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-GB', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>Greyed-out days are unavailable</Text>
            )}
          </View>

          {/* Time Slots */}
          {selectedDate && (
            <View style={styles.timeSection}>
              <Text style={styles.sectionTitle}>Select Time</Text>
              {availableSlots.length > 0 ? (
                <View style={styles.timeGrid}>
                  {availableSlots.map((slot) => (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlot,
                        selectedTime === slot && styles.timeSlotSelected,
                      ]}
                      onPress={() => setSelectedTime(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          selectedTime === slot && styles.timeSlotTextSelected,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.noSlotsText}>No available times for this day</Text>
              )}
            </View>
          )}

          {/* Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Your Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                testID="book-name-input"
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
                testID="book-email-input"
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
                testID="book-phone-input"
                style={styles.input}
                placeholder="Enter your phone number"
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Service Selection</Text>

            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleButton, !isCustomQuote && styles.toggleButtonActive]}
                onPress={() => setIsCustomQuote(false)}
              >
                <Text style={[styles.toggleText, !isCustomQuote && styles.toggleTextActive]}>
                  Select Service
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, isCustomQuote && styles.toggleButtonActive]}
                onPress={() => setIsCustomQuote(true)}
              >
                <Text style={[styles.toggleText, isCustomQuote && styles.toggleTextActive]}>
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
                        selectedService === service.id && styles.serviceOptionSelected,
                      ]}
                      onPress={() => setSelectedService(service.id)}
                    >
                      <Text
                        style={[
                          styles.serviceOptionName,
                          selectedService === service.id && styles.serviceOptionNameSelected,
                        ]}
                      >
                        {service.name}
                      </Text>
                      <Text style={styles.serviceOptionPrice}>
                        {service.price} kr
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            ) : (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Describe Your Design *</Text>
                <TextInput
                  testID="book-custom-desc"
                  style={[styles.input, styles.textArea]}
                  placeholder="Tell us about your custom design idea..."
                  value={customDescription}
                  onChangeText={setCustomDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                <Text style={styles.noteText}>Custom designs from +100–150 kr</Text>
              </View>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Location</Text>

            <View style={styles.toggleGroup}>
              <TouchableOpacity
                style={[styles.toggleButton, locationType === 'studio' && styles.toggleButtonActive]}
                onPress={() => setLocationType('studio')}
              >
                <Ionicons
                  name="business-outline"
                  size={18}
                  color={locationType === 'studio' ? COLORS.white : COLORS.text}
                />
                <Text style={[styles.toggleText, locationType === 'studio' && styles.toggleTextActive]}>
                  Studio
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, locationType === 'mobile' && styles.toggleButtonActive]}
                onPress={() => setLocationType('mobile')}
              >
                <Ionicons
                  name="car-outline"
                  size={18}
                  color={locationType === 'mobile' ? COLORS.white : COLORS.text}
                />
                <Text style={[styles.toggleText, locationType === 'mobile' && styles.toggleTextActive]}>
                  Mobile
                </Text>
              </TouchableOpacity>
            </View>

            {locationType === 'mobile' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Your Address *</Text>
                <TextInput
                  testID="book-address-input"
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
                  Mobile service available if you pay the travel expenses
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Additional Notes</Text>
              <TextInput
                testID="book-notes-input"
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

            <TouchableOpacity
              testID="submit-booking-btn"
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
  calendarSection: {
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
    marginBottom: 12,
  },
  calendar: {
    borderRadius: 12,
  },
  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBg,
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  hintText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  timeSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.lightBg,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  timeSlotText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  timeSlotTextSelected: {
    color: COLORS.white,
  },
  noSlotsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 16,
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
