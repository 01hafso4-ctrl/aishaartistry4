import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

const COLORS = {
  primary: '#D4688A',
  secondary: '#F5C6D0',
  accent: '#E8A0B5',
  background: '#FFF5F8',
  text: '#3A1F2E',
  white: '#FFFFFF',
  lightBg: '#FFF0F5',
  border: '#F0D7DF',
};

const TIME_SLOTS = [
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export default function Book() {
  const params = useLocalSearchParams();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const serviceName =
    typeof params.serviceName === 'string' ? params.serviceName : 'Henna Service';

  const dates = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      return {
        key: d.toISOString(),
        label: d.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
      };
    });
  }, []);

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert('Missing info', 'Please select a date and time first.');
      return;
    }

    Alert.alert(
      'Booking selected',
      `${serviceName}\n${selectedDate} at ${selectedTime}\n\nNext step: we will connect this to saved bookings.`
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Book Appointment</Text>
          <Text style={styles.subtitle}>
            Choose your preferred date and time
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Selected Service</Text>
          <View style={styles.serviceBox}>
            <Text style={styles.serviceText}>{serviceName}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose a Date</Text>
          <View style={styles.optionsWrap}>
            {dates.map((date) => {
              const active = selectedDate === date.label;
              return (
                <TouchableOpacity
                  key={date.key}
                  style={[styles.optionButton, active && styles.optionButtonActive]}
                  onPress={() => setSelectedDate(date.label)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {date.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Choose a Time</Text>
          <View style={styles.optionsWrap}>
            {TIME_SLOTS.map((time) => {
              const active = selectedTime === time;
              return (
                <TouchableOpacity
                  key={time}
                  style={[styles.optionButton, active && styles.optionButtonActive]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      active && styles.optionTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <Text style={styles.summaryText}>Service: {serviceName}</Text>
          <Text style={styles.summaryText}>
            Date: {selectedDate || 'Not selected'}
          </Text>
          <Text style={styles.summaryText}>
            Time: {selectedTime || 'Not selected'}
          </Text>

          <TouchableOpacity style={styles.bookButton} onPress={handleBooking}>
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
  },
  card: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  serviceBox: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
    padding: 14,
  },
  serviceText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  optionTextActive: {
    color: COLORS.white,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  bookButton: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  bookButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
