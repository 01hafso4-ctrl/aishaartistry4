import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#D4688A',
  secondary: '#F5C6D0',
  accent: '#E8A0B5',
  background: '#FFF5F8',
  text: '#3A1F2E',
  white: '#FFFFFF',
  lightBg: '#FFF0F5',
};

interface BusinessSettings {
  business_name: string;
  tagline: string;
  phone: string;
  email: string;
  instagram: string;
  studio_address: string;
  about_text: string;
}

export default function HomeScreen() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Seed data first
      await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/seed`, { method: 'POST' });
      
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>
              {settings?.business_name || 'Aishaartistry'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {settings?.tagline || 'Beautiful Henna Art for Every Occasion'}
            </Text>
            <TouchableOpacity
  style={styles.ctaButton}
  onPress={() => {
    Linking.openURL(
      "https://www.fresha.com/book-now/aishaartistry4-fb058pbl/all-offer?share=true&pId=2853591"
    );
  }}
>
  <Text style={styles.ctaButtonText}>Book Now</Text>
  <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
</TouchableOpacity>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinksSection}>
          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => router.push('/services')}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="sparkles" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLinkTitle}>Services</Text>
            <Text style={styles.quickLinkDesc}>View our pricing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => router.push('/gallery')}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="images" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLinkTitle}>Gallery</Text>
            <Text style={styles.quickLinkDesc}>See our work</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickLinkCard}
            onPress={() => router.push('/contact')}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="call" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.quickLinkTitle}>Contact</Text>
            <Text style={styles.quickLinkDesc}>Get in touch</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <Text style={styles.aboutText}>
            {settings?.about_text ||
              'Welcome to our henna studio! We create beautiful, intricate designs for all occasions.'}
          </Text>
        </View>

        {/* Services Preview */}
        <View style={styles.servicesPreview}>
          <Text style={styles.sectionTitle}>Our Services</Text>
          <View style={styles.servicesList}>
            <ServiceItem
              icon="hand-left-outline"
              title="Hand Designs"
              description="From simple to intricate"
            />
            <ServiceItem
              icon="heart-outline"
              title="Bridal Henna"
              description="Complete wedding packages"
            />
            <ServiceItem
              icon="star-outline"
              title="Custom Designs"
              description="Your vision, our art"
            />
            <ServiceItem
              icon="car-outline"
              title="Mobile Service"
              description="We come to you (travel expenses apply)"
            />
          </View>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => router.push('/services')}
          >
            <Text style={styles.viewAllText}>View All Services</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Get In Touch</Text>
          <View style={styles.contactInfo}>
            {settings?.phone && (
              <View style={styles.contactItem}>
                <Ionicons name="call-outline" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>+47 {settings.phone}</Text>
              </View>
            )}
            {settings?.email && (
              <View style={styles.contactItem}>
                <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{settings.email}</Text>
              </View>
            )}
            {settings?.instagram && (
              <View style={styles.contactItem}>
                <Ionicons name="logo-instagram" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{settings.instagram}</Text>
              </View>
            )}
            {settings?.studio_address && (
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                <Text style={styles.contactText}>{settings.studio_address}</Text>
              </View>
            )}
            <View style={styles.contactItem}>
              <Ionicons name="flag-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>Available in Norway only</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {settings?.business_name || 'Aishaartistry'}
          </Text>
          <Text style={styles.footerSubtext}>Making moments beautiful</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ServiceItem({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.serviceItem}>
      <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      <View style={styles.serviceItemText}>
        <Text style={styles.serviceItemTitle}>{title}</Text>
        <Text style={styles.serviceItemDesc}>{description}</Text>
      </View>
    </View>
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
  heroSection: {
    height: 320,
    backgroundColor: COLORS.primary,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(212, 104, 138, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    gap: 8,
  },
  ctaButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  quickLinksSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginTop: -40,
  },
  quickLinkCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickLinkIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  quickLinkDesc: {
    fontSize: 11,
    color: '#888',
  },
  aboutSection: {
    padding: 24,
    backgroundColor: COLORS.white,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  servicesPreview: {
    padding: 24,
    backgroundColor: COLORS.lightBg,
  },
  servicesList: {
    gap: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  serviceItemText: {
    flex: 1,
  },
  serviceItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  serviceItemDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 4,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  contactSection: {
    padding: 24,
    backgroundColor: COLORS.white,
  },
  contactInfo: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 15,
    color: COLORS.text,
  },
  footer: {
    padding: 32,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  footerSubtext: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
  },
});
