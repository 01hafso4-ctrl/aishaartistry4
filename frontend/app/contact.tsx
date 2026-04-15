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
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

export default function ContactScreen() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/settings`);
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          message,
        }),
      });

      if (response.ok) {
        Alert.alert(
          'Message Sent!',
          'Thank you for reaching out. We will get back to you soon.',
          [{ text: 'OK' }]
        );
        setName('');
        setEmail('');
        setPhone('');
        setMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const openPhone = () => {
    if (settings?.phone) {
      Linking.openURL(`tel:+47${settings.phone.replace(/[^0-9]/g, '')}`);
    }
  };

  const openEmail = () => {
    if (settings?.email) {
      Linking.openURL(`mailto:${settings.email}`);
    }
  };

  const openInstagram = () => {
    if (settings?.instagram) {
      const handle = settings.instagram.replace('@', '');
      Linking.openURL(`https://instagram.com/${handle}`);
    }
  };

  const openMaps = () => {
    if (settings?.studio_address) {
      const query = encodeURIComponent(settings.studio_address);
      Linking.openURL(`https://maps.google.com/?q=${query}`);
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
            <Text style={styles.headerTitle}>Contact Us</Text>
            <Text style={styles.headerSubtitle}>
              We would love to hear from you!
            </Text>
          </View>

          {/* Contact Info Cards */}
          <View style={styles.contactCardsSection}>
            {settings?.phone && (
              <TouchableOpacity style={styles.contactCard} onPress={openPhone}>
                <View style={styles.contactCardIcon}>
                  <Ionicons name="call" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.contactCardContent}>
                  <Text style={styles.contactCardLabel}>Phone (Norway)</Text>
                  <Text style={styles.contactCardValue}>+47 {settings.phone}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}

            {settings?.email && (
              <TouchableOpacity style={styles.contactCard} onPress={openEmail}>
                <View style={styles.contactCardIcon}>
                  <Ionicons name="mail" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.contactCardContent}>
                  <Text style={styles.contactCardLabel}>Email</Text>
                  <Text style={styles.contactCardValue}>{settings.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}

            {settings?.instagram && (
              <TouchableOpacity style={styles.contactCard} onPress={openInstagram}>
                <View style={styles.contactCardIcon}>
                  <Ionicons name="logo-instagram" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.contactCardContent}>
                  <Text style={styles.contactCardLabel}>Instagram</Text>
                  <Text style={styles.contactCardValue}>{settings.instagram}</Text>
                  <Text style={styles.contactCardLink}>Tap to visit our Instagram</Text>
                </View>
                <Ionicons name="open-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            )}

            {settings?.studio_address && (
              <TouchableOpacity style={styles.contactCard} onPress={openMaps}>
                <View style={styles.contactCardIcon}>
                  <Ionicons name="location" size={24} color={COLORS.primary} />
                </View>
                <View style={styles.contactCardContent}>
                  <Text style={styles.contactCardLabel}>Studio Address</Text>
                  <Text style={styles.contactCardValue}>{settings.studio_address}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            )}
          </View>

          {/* Contact Form */}
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Send Us a Message</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={name}
                onChangeText={setName}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="How can we help you?"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholderTextColor="#999"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Send Message</Text>
                  <Ionicons name="send" size={20} color={COLORS.white} />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Common Questions</Text>

            <FAQItem
              question="How long does henna last?"
              answer="Henna typically lasts 1-3 weeks depending on skin type, aftercare, and location on the body."
            />
            <FAQItem
              question="How far in advance should I book?"
              answer="We recommend booking at least 2 weeks in advance, especially for bridal appointments. However, we do our best to accommodate last-minute requests."
            />
            <FAQItem
              question="Do you travel for appointments?"
              answer="Yes! We offer mobile services and can come to your location. Travel expenses must be covered by the customer."
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      style={styles.faqItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.primary}
        />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{answer}</Text>}
    </TouchableOpacity>
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
  contactCardsSection: {
    paddingHorizontal: 16,
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contactCardContent: {
    flex: 1,
  },
  contactCardLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  contactCardValue: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  contactCardLink: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 2,
  },
  formSection: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
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
    minHeight: 120,
    textAlignVertical: 'top',
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
  faqSection: {
    padding: 16,
    marginBottom: 24,
  },
  faqItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
