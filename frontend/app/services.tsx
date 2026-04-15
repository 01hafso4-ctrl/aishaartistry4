import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#8B4513',
  secondary: '#D4A574',
  accent: '#C9A96E',
  background: '#FFF8F0',
  text: '#3D2914',
  white: '#FFFFFF',
  lightBg: '#FDF5ED',
};

interface Service {
  id: string;
  name: string;
  description: string;
  size: string;
  price: number;
  duration_minutes: number;
}

const sizeLabels: Record<string, string> = {
  small: 'Small',
  medium: 'Medium',
  large: 'Large',
  bridal: 'Bridal',
  custom: 'Custom',
};

const sizeIcons: Record<string, string> = {
  small: 'finger-print-outline',
  medium: 'hand-left-outline',
  large: 'hand-right-outline',
  bridal: 'heart-outline',
  custom: 'color-palette-outline',
};

export default function ServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/services`);
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const formatDuration = (minutes: number) => {
    if (minutes === 0) return 'Varies';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Get Quote';
    return `${price.toFixed(0)} kr`;
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Henna Services</Text>
          <Text style={styles.headerSubtitle}>
            Choose from our range of beautiful henna designs
          </Text>
        </View>

        {/* Services List */}
        <View style={styles.servicesList}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={styles.serviceCard}
              onPress={() =>
                router.push({
                  pathname: '/book',
                  params: {
                    serviceId: service.id,
                    serviceName: service.name,
                    isCustom: service.size === 'custom' ? 'true' : 'false',
                  },
                })
              }
            >
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIcon}>
                  <Ionicons
                    name={(sizeIcons[service.size] || 'sparkles-outline') as any}
                    size={28}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.sizeTag}>
                  <Text style={styles.sizeTagText}>
                    {sizeLabels[service.size] || service.size}
                  </Text>
                </View>
              </View>

              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>

              <View style={styles.serviceFooter}>
                <View style={styles.durationContainer}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color="#888"
                  />
                  <Text style={styles.durationText}>
                    {formatDuration(service.duration_minutes)}
                  </Text>
                </View>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>
                    {formatPrice(service.price)}
                  </Text>
                </View>
              </View>

              <View style={styles.bookButton}>
                <Text style={styles.bookButtonText}>
                  {service.size === 'custom' ? 'Request Quote' : 'Book Now'}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={COLORS.white}
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Custom Designs</Text>
              <Text style={styles.infoText}>
                Have something special in mind? We create custom designs tailored to your preferences. Contact us for a personalized quote.
              </Text>
            </View>
          </View>
        </View>

        {/* Booking Note */}
        <View style={styles.noteSection}>
          <Text style={styles.noteTitle}>Booking Information</Text>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.noteText}>All prices are per hand/foot unless stated</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.noteText}>Bridal package includes hands, arms, legs, chest and back</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.noteText}>Custom designs from +100–150 kr</Text>
          </View>
          <View style={styles.noteItem}>
            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
            <Text style={styles.noteText}>Mobile service available if you pay the travel expenses</Text>
          </View>
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
  headerInfo: {
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
    lineHeight: 22,
  },
  servicesList: {
    padding: 16,
    gap: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizeTag: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  sizeTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    fontSize: 14,
    color: '#888',
  },
  priceContainer: {
    backgroundColor: COLORS.lightBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoSection: {
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noteSection: {
    padding: 24,
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
  },
  noteTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
  },
});
