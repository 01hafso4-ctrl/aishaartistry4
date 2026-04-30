import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

const COLORS = {
  primary: '#D4688A',
  background: '#FFF5F8',
  text: '#3A1F2E',
  white: '#FFFFFF',
  lightBg: '#FFF0F5',
  border: '#F0D7DF',
  success: '#4CAF50',
  error: '#F44336',
};

interface Booking {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  service_name?: string;
  date: string;
  time: string;
  message?: string;
  status: string;
  created_at: string;
}

interface Availability {
  id: string;
  date: string;
  time: string;
  is_available: boolean;
}

export default function AdminScreen() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);

    const { data: bookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: availabilityData, error: availabilityError } = await supabase
      .from('availability')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (bookingsError) {
      console.error(bookingsError);
      Alert.alert('Feil', 'Kunne ikke hente bookinger.');
    }

    if (availabilityError) {
      console.error(availabilityError);
      Alert.alert('Feil', 'Kunne ikke hente tilgjengelige tider.');
    }

    setBookings(bookingsData || []);
    setAvailability(availabilityData || []);
    setLoading(false);
  };

  const addAvailability = async () => {
    if (!newDate || !newTime) {
      Alert.alert('Mangler info', 'Skriv inn både dato og klokkeslett.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('availability').insert({
      date: newDate,
      time: newTime,
      is_available: true,
    });

    setSaving(false);

    if (error) {
      console.error(error);
      Alert.alert('Feil', 'Kunne ikke legge til tid.');
      return;
    }

    setNewDate('');
    setNewTime('');
    Alert.alert('Ferdig', 'Ny ledig tid er lagt til.');
    fetchAdminData();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error(error);
      Alert.alert('Feil', 'Kunne ikke oppdatere booking.');
      return;
    }

    fetchAdminData();
  };

  const deleteAvailability = async (id: string) => {
    const { error } = await supabase.from('availability').delete().eq('id', id);

    if (error) {
      console.error(error);
      Alert.alert('Feil', 'Kunne ikke slette tiden.');
      return;
    }

    fetchAdminData();
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>NY ADMIN SIDE</Text>
        <Text style={styles.subtitle}>Manage bookings and available times</Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Add Available Time</Text>

          <TextInput
            style={styles.input}
            placeholder="Date: 2026-05-10"
            value={newDate}
            onChangeText={setNewDate}
            placeholderTextColor="#999"
          />

          <TextInput
            style={styles.input}
            placeholder="Time: 14:00"
            value={newTime}
            onChangeText={setNewTime}
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={addAvailability}
            disabled={saving}
          >
            <Text style={styles.primaryButtonText}>
              {saving ? 'Saving...' : 'Add Time'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Available Times</Text>

          {availability.length === 0 ? (
            <Text style={styles.emptyText}>No available times yet.</Text>
          ) : (
            availability.map((slot) => (
              <View key={slot.id} style={styles.row}>
                <View>
                  <Text style={styles.rowTitle}>{slot.date}</Text>
                  <Text style={styles.rowSub}>{slot.time}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteAvailability(slot.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Bookings</Text>

          {bookings.length === 0 ? (
            <Text style={styles.emptyText}>No bookings yet.</Text>
          ) : (
            bookings.map((booking) => (
              <View key={booking.id} style={styles.bookingCard}>
                <Text style={styles.rowTitle}>{booking.customer_name}</Text>
                <Text style={styles.rowSub}>
                  {booking.service_name || 'Henna Service'}
                </Text>
                <Text style={styles.rowSub}>
                  {booking.date} at {booking.time}
                </Text>
                <Text style={styles.rowSub}>
                  {booking.customer_email || ''} {booking.customer_phone || ''}
                </Text>

                {booking.message ? (
                  <Text style={styles.message}>{booking.message}</Text>
                ) : null}

                <Text style={styles.status}>Status: {booking.status}</Text>

                {booking.status === 'pending' ? (
                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() =>
                        updateBookingStatus(booking.id, 'accepted')
                      }
                    >
                      <Text style={styles.actionText}>Accept</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.declineButton]}
                      onPress={() =>
                        updateBookingStatus(booking.id, 'declined')
                      }
                    >
                      <Text style={styles.actionText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            ))
          )}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  input: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: '#777',
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  rowSub: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deleteButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  bookingCard: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  message: {
    color: COLORS.text,
    marginTop: 8,
    fontSize: 14,
  },
  status: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  declineButton: {
    backgroundColor: COLORS.error,
  },
  actionText: {
    color: COLORS.white,
    fontWeight: '700',
  },
});
