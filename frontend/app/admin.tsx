import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

const COLORS = {
  primary: '#D4688A',
  secondary: '#F5C6D0',
  accent: '#E8A0B5',
  background: '#FFF5F8',
  text: '#3A1F2E',
  white: '#FFFFFF',
  lightBg: '#FFF0F5',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
};

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_name?: string;
  is_custom_quote: boolean;
  custom_description?: string;
  preferred_date: string;
  preferred_time: string;
  location_type: string;
  location_address?: string;
  notes?: string;
  status: string;
  created_at: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

type Tab = 'bookings' | 'messages' | 'gallery' | 'settings' | 'services';

const statusColors: Record<string, string> = {
  pending: COLORS.warning,
  confirmed: COLORS.success,
  rejected: COLORS.error,
  completed: '#666',
};

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [galleryDescription, setGalleryDescription] = useState('');
  const [galleryCategory, setGalleryCategory] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Settings state
  const [settingsBusinessName, setSettingsBusinessName] = useState('');
  const [settingsTagline, setSettingsTagline] = useState('');
  const [settingsAbout, setSettingsAbout] = useState('');
  const [settingsPhone, setSettingsPhone] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsInstagram, setSettingsInstagram] = useState('');
  const [settingsAddress, setSettingsAddress] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Availability state
  const [availabilityData, setAvailabilityData] = useState<Record<number, { is_available: boolean; start_time: string; end_time: string }>>({});
  const [savingAvailability, setSavingAvailability] = useState(false);

  // Services state
  const [adminServices, setAdminServices] = useState<any[]>([]);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [savingService, setSavingService] = useState(false);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [bookingsRes, contactsRes, settingsRes, availRes, servicesRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contacts`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/settings`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/availability`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/services/all`),
      ]);
      const bookingsData = await bookingsRes.json();
      const contactsData = await contactsRes.json();
      const settingsData = await settingsRes.json();
      const availData = await availRes.json();
      const servicesData = await servicesRes.json();
      setBookings(bookingsData);
      setContacts(contactsData);
      setAdminServices(servicesData);
      setSettingsBusinessName(settingsData.business_name || '');
      setSettingsTagline(settingsData.tagline || '');
      setSettingsAbout(settingsData.about_text || '');
      setSettingsPhone(settingsData.phone || '');
      setSettingsEmail(settingsData.email || '');
      setSettingsInstagram(settingsData.instagram || '');
      setSettingsAddress(settingsData.studio_address || '');
      // Parse availability
      const availMap: Record<number, { is_available: boolean; start_time: string; end_time: string }> = {};
      for (const a of availData) {
        availMap[a.day_of_week] = { is_available: a.is_available, start_time: a.start_time, end_time: a.end_time };
      }
      // Fill defaults for missing days
      for (let i = 0; i < 7; i++) {
        if (!availMap[i]) {
          availMap[i] = { is_available: i !== 0, start_time: '10:00', end_time: '18:00' };
        }
      }
      setAvailabilityData(availMap);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/bookings/${bookingId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
        );
        setSelectedBooking(null);
        Alert.alert('Success', `Booking ${status}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update booking');
    }
  };

  const markContactRead = async (contactId: string) => {
    try {
      await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contacts/${contactId}/read`, {
        method: 'PATCH',
      });
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, is_read: true } : c))
      );
    } catch (error) {
      console.error('Error marking contact as read:', error);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      uploadImage(result.assets[0].base64);
    }
  };

  const uploadImage = async (base64: string) => {
    if (!galleryTitle.trim()) {
      Alert.alert('Error', 'Please enter a title for the image');
      return;
    }

    setUploadingImage(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/gallery`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: galleryTitle,
          description: galleryDescription || null,
          image_base64: `data:image/jpeg;base64,${base64}`,
          category: galleryCategory || null,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Image uploaded to gallery');
        setShowGalleryModal(false);
        setGalleryTitle('');
        setGalleryDescription('');
        setGalleryCategory('');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending').length;
  const unreadMessages = contacts.filter((c) => !c.is_read).length;

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: settingsBusinessName,
          tagline: settingsTagline,
          about_text: settingsAbout,
          phone: settingsPhone,
          email: settingsEmail,
          instagram: settingsInstagram,
          studio_address: settingsAddress,
        }),
      });
      if (response.ok) {
        Alert.alert('Saved!', 'Your business info has been updated.');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const toggleDayAvailability = (day: number) => {
    setAvailabilityData((prev) => ({
      ...prev,
      [day]: { ...prev[day], is_available: !prev[day].is_available },
    }));
  };

  const updateDayTime = (day: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailabilityData((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const bulk = Object.entries(availabilityData).map(([day, data]) => ({
        day_of_week: parseInt(day),
        start_time: data.start_time,
        end_time: data.end_time,
        is_available: data.is_available,
      }));
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/availability/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bulk),
      });
      if (response.ok) {
        Alert.alert('Saved!', 'Availability has been updated.');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save availability.');
    } finally {
      setSavingAvailability(false);
    }
  };

  const startEditService = (service: any) => {
    setEditingService(service);
    setEditName(service.name);
    setEditDesc(service.description);
    setEditPrice(String(service.price));
    setEditDuration(String(service.duration_minutes));
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword }),
      });
      if (response.ok) {
        setIsAuthenticated(true);
        fetchData();
      } else {
        setLoginError('Incorrect password');
      }
    } catch (error) {
      setLoginError('Connection error. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const saveServiceEdit = async () => {
    if (!editingService) return;
    setSavingService(true);
    try {
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/services/${editingService.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: editName,
            description: editDesc,
            price: parseFloat(editPrice) || 0,
            duration_minutes: parseInt(editDuration) || 0,
          }),
        }
      );
      if (response.ok) {
        const updated = await response.json();
        setAdminServices((prev) =>
          prev.map((s) => (s.id === editingService.id ? updated : s))
        );
        setEditingService(null);
        Alert.alert('Saved!', 'Service has been updated.');
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save service.');
    } finally {
      setSavingService(false);
    }
  };

  if (loading && isAuthenticated) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loginContainer}>
          <View style={styles.loginCard}>
            <View style={styles.loginIconCircle}>
              <Ionicons name="lock-closed" size={36} color={COLORS.primary} />
            </View>
            <Text style={styles.loginTitle}>Admin Login</Text>
            <Text style={styles.loginSubtitle}>Enter your password to access the dashboard</Text>
            {loginError ? (
              <View style={styles.loginErrorBox}>
                <Ionicons name="alert-circle" size={16} color={COLORS.error} />
                <Text style={styles.loginErrorText}>{loginError}</Text>
              </View>
            ) : null}
            <TextInput
              testID="admin-password-input"
              style={styles.loginInput}
              placeholder="Password"
              value={loginPassword}
              onChangeText={setLoginPassword}
              secureTextEntry
              placeholderTextColor="#999"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity
              testID="admin-login-btn"
              style={[styles.loginButton, loginLoading && styles.saveButtonDisabled]}
              onPress={handleLogin}
              disabled={loginLoading}
            >
              {loginLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.loginButtonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Notification Banner */}
      {(pendingBookings > 0 || unreadMessages > 0) && (
        <View style={styles.notifBanner}>
          <Ionicons name="notifications" size={20} color={COLORS.white} />
          <Text style={styles.notifBannerText}>
            {pendingBookings > 0 && unreadMessages > 0
              ? `${pendingBookings} new booking${pendingBookings > 1 ? 's' : ''} & ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`
              : pendingBookings > 0
              ? `${pendingBookings} new booking request${pendingBookings > 1 ? 's' : ''} waiting for your response!`
              : `${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''} from customers`}
          </Text>
        </View>
      )}

      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <TouchableOpacity style={[styles.statCard, pendingBookings > 0 && styles.statCardAlert]} onPress={() => setActiveTab('bookings')}>
          <Text style={[styles.statNumber, pendingBookings > 0 && styles.statNumberAlert]}>{pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.statCard, unreadMessages > 0 && styles.statCardAlert]} onPress={() => setActiveTab('messages')}>
          <Text style={[styles.statNumber, unreadMessages > 0 && styles.statNumberAlert]}>{unreadMessages}</Text>
          <Text style={styles.statLabel}>Unread Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'bookings' && styles.tabActive]}
          onPress={() => setActiveTab('bookings')}
        >
          <Ionicons
            name="calendar"
            size={20}
            color={activeTab === 'bookings' ? COLORS.primary : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'bookings' && styles.tabTextActive,
            ]}
          >
            Bookings
          </Text>
          {pendingBookings > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendingBookings}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons
            name="mail"
            size={20}
            color={activeTab === 'messages' ? COLORS.primary : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'messages' && styles.tabTextActive,
            ]}
          >
            Messages
          </Text>
          {unreadMessages > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadMessages}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'gallery' && styles.tabActive]}
          onPress={() => setActiveTab('gallery')}
        >
          <Ionicons
            name="images"
            size={20}
            color={activeTab === 'gallery' ? COLORS.primary : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'gallery' && styles.tabTextActive,
            ]}
          >
            Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons
            name="create"
            size={20}
            color={activeTab === 'settings' ? COLORS.primary : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'settings' && styles.tabTextActive,
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'services' && styles.tabActive]}
          onPress={() => setActiveTab('services')}
        >
          <Ionicons
            name="pricetag"
            size={20}
            color={activeTab === 'services' ? COLORS.primary : '#888'}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'services' && styles.tabTextActive,
            ]}
          >
            Prices
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'bookings' && (
          <View style={styles.listSection}>
            {bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No bookings yet</Text>
              </View>
            ) : (
              bookings.map((booking) => (
                <TouchableOpacity
                  key={booking.id}
                  style={styles.bookingCard}
                  onPress={() => setSelectedBooking(booking)}
                >
                  <View style={styles.bookingHeader}>
                    <Text style={styles.customerName}>{booking.customer_name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColors[booking.status] },
                      ]}
                    >
                      <Text style={styles.statusText}>{booking.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.bookingService}>
                    {booking.is_custom_quote
                      ? 'Custom Quote Request'
                      : booking.service_name || 'Service'}
                  </Text>
                  <View style={styles.bookingDetails}>
                    <View style={styles.bookingDetail}>
                      <Ionicons name="calendar-outline" size={14} color="#888" />
                      <Text style={styles.bookingDetailText}>
                        {booking.preferred_date}
                      </Text>
                    </View>
                    <View style={styles.bookingDetail}>
                      <Ionicons name="time-outline" size={14} color="#888" />
                      <Text style={styles.bookingDetailText}>
                        {booking.preferred_time}
                      </Text>
                    </View>
                    <View style={styles.bookingDetail}>
                      <Ionicons
                        name={
                          booking.location_type === 'studio'
                            ? 'business-outline'
                            : 'car-outline'
                        }
                        size={14}
                        color="#888"
                      />
                      <Text style={styles.bookingDetailText}>
                        {booking.location_type === 'studio' ? 'Studio' : 'Mobile'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'messages' && (
          <View style={styles.listSection}>
            {contacts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No messages yet</Text>
              </View>
            ) : (
              contacts.map((contact) => (
                <TouchableOpacity
                  key={contact.id}
                  style={[
                    styles.messageCard,
                    !contact.is_read && styles.messageCardUnread,
                  ]}
                  onPress={() => markContactRead(contact.id)}
                >
                  <View style={styles.messageHeader}>
                    <Text style={styles.messageName}>{contact.name}</Text>
                    {!contact.is_read && <View style={styles.unreadDot} />}
                  </View>
                  <Text style={styles.messageEmail}>{contact.email}</Text>
                  <Text style={styles.messageContent} numberOfLines={2}>
                    {contact.message}
                  </Text>
                  <Text style={styles.messageDate}>
                    {new Date(contact.created_at).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'gallery' && (
          <View style={styles.gallerySection}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => setShowGalleryModal(true)}
            >
              <Ionicons name="cloud-upload" size={24} color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Upload New Image</Text>
            </TouchableOpacity>

            <View style={styles.galleryInfo}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
              <Text style={styles.galleryInfoText}>
                Upload your best henna designs to showcase in the gallery.
                Images should be high quality and well-lit.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'settings' && (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Business Info</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                  testID="settings-business-name"
                  style={styles.input}
                  placeholder="Your business name"
                  value={settingsBusinessName}
                  onChangeText={setSettingsBusinessName}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tagline</Text>
                <TextInput
                  testID="settings-tagline"
                  style={styles.input}
                  placeholder="Short tagline"
                  value={settingsTagline}
                  onChangeText={setSettingsTagline}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>About Us Text</Text>
                <TextInput
                  testID="settings-about-text"
                  style={[styles.input, styles.aboutTextArea]}
                  placeholder="Write your about us text here..."
                  value={settingsAbout}
                  onChangeText={setSettingsAbout}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
                <Text style={styles.charCount}>{settingsAbout.length} characters</Text>
              </View>

              <Text style={[styles.settingsSectionTitle, { marginTop: 24 }]}>Contact Details</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  testID="settings-phone"
                  style={styles.input}
                  placeholder="e.g. 46655648"
                  value={settingsPhone}
                  onChangeText={setSettingsPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  testID="settings-email"
                  style={styles.input}
                  placeholder="your@email.com"
                  value={settingsEmail}
                  onChangeText={setSettingsEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Instagram Username</Text>
                <TextInput
                  testID="settings-instagram"
                  style={styles.input}
                  placeholder="@yourusername"
                  value={settingsInstagram}
                  onChangeText={setSettingsInstagram}
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Studio Address</Text>
                <TextInput
                  testID="settings-address"
                  style={styles.input}
                  placeholder="Your studio address"
                  value={settingsAddress}
                  onChangeText={setSettingsAddress}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                testID="save-settings-btn"
                style={[styles.saveButton, savingSettings && styles.saveButtonDisabled]}
                onPress={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color={COLORS.white} />
                    <Text style={styles.saveButtonText}>Save Business Info</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Availability Management */}
            <View style={[styles.settingsSection, { marginTop: 16 }]}>
              <Text style={styles.settingsSectionTitle}>Manage Availability</Text>
              <Text style={styles.availHint}>Toggle days on/off and set opening hours. Customers will only be able to book on available days.</Text>

              {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                <View key={day} style={styles.availRow}>
                  <TouchableOpacity
                    style={styles.availToggle}
                    onPress={() => toggleDayAvailability(day)}
                  >
                    <View style={[styles.availDot, availabilityData[day]?.is_available ? styles.availDotOn : styles.availDotOff]} />
                    <Text style={[styles.availDayName, !availabilityData[day]?.is_available && styles.availDayNameOff]}>
                      {dayNames[day]}
                    </Text>
                  </TouchableOpacity>
                  {availabilityData[day]?.is_available ? (
                    <View style={styles.availTimes}>
                      <TextInput
                        style={styles.availTimeInput}
                        value={availabilityData[day]?.start_time}
                        onChangeText={(v) => updateDayTime(day, 'start_time', v)}
                        placeholder="10:00"
                        placeholderTextColor="#999"
                      />
                      <Text style={styles.availDash}>–</Text>
                      <TextInput
                        style={styles.availTimeInput}
                        value={availabilityData[day]?.end_time}
                        onChangeText={(v) => updateDayTime(day, 'end_time', v)}
                        placeholder="18:00"
                        placeholderTextColor="#999"
                      />
                    </View>
                  ) : (
                    <Text style={styles.availClosedText}>Closed</Text>
                  )}
                </View>
              ))}

              <TouchableOpacity
                testID="save-availability-btn"
                style={[styles.saveButton, savingAvailability && styles.saveButtonDisabled]}
                onPress={saveAvailability}
                disabled={savingAvailability}
              >
                {savingAvailability ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Ionicons name="calendar" size={20} color={COLORS.white} />
                    <Text style={styles.saveButtonText}>Save Availability</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}

        {activeTab === 'services' && (
          <View style={styles.listSection}>
            <Text style={styles.settingsSectionTitle}>Manage Services & Prices</Text>
            <Text style={styles.availHint}>Tap any service to edit its name, description, and price.</Text>

            {adminServices.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.serviceEditCard}
                onPress={() => startEditService(service)}
              >
                <View style={styles.serviceEditHeader}>
                  <Text style={styles.serviceEditName}>{service.name}</Text>
                  <Text style={styles.serviceEditPrice}>
                    {service.price > 0 ? `${service.price} kr` : 'Quote'}
                  </Text>
                </View>
                <Text style={styles.serviceEditDesc} numberOfLines={2}>
                  {service.description}
                </Text>
                <View style={styles.serviceEditFooter}>
                  <Text style={styles.serviceEditMeta}>
                    {service.duration_minutes > 0 ? `${service.duration_minutes} min` : 'Varies'} · {service.size}
                  </Text>
                  <Ionicons name="pencil" size={16} color={COLORS.primary} />
                </View>
              </TouchableOpacity>
            ))}

            {/* Edit Service Modal */}
            <Modal
              visible={editingService !== null}
              animationType="slide"
              transparent={true}
              onRequestClose={() => setEditingService(null)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Service</Text>
                    <TouchableOpacity onPress={() => setEditingService(null)}>
                      <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.modalBody}>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Service Name</Text>
                      <TextInput
                        style={styles.input}
                        value={editName}
                        onChangeText={setEditName}
                        placeholder="Service name"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Description</Text>
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        value={editDesc}
                        onChangeText={setEditDesc}
                        placeholder="Service description"
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Price (kr)</Text>
                      <TextInput
                        style={styles.input}
                        value={editPrice}
                        onChangeText={setEditPrice}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Duration (minutes)</Text>
                      <TextInput
                        style={styles.input}
                        value={editDuration}
                        onChangeText={setEditDuration}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor="#999"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.saveButton, savingService && styles.saveButtonDisabled]}
                      onPress={saveServiceEdit}
                      disabled={savingService}
                    >
                      {savingService ? (
                        <ActivityIndicator color={COLORS.white} />
                      ) : (
                        <>
                          <Ionicons name="save" size={20} color={COLORS.white} />
                          <Text style={styles.saveButtonText}>Save Service</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          </View>
        )}
      </ScrollView>

      {/* Booking Detail Modal */}
      <Modal
        visible={selectedBooking !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking Details</Text>
              <TouchableOpacity onPress={() => setSelectedBooking(null)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Customer</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.customer_name}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Contact</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.customer_email}
                  </Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.customer_phone}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Service</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.is_custom_quote
                      ? 'Custom Quote Request'
                      : selectedBooking.service_name || 'Not specified'}
                  </Text>
                  {selectedBooking.custom_description && (
                    <Text style={styles.modalDescription}>
                      {selectedBooking.custom_description}
                    </Text>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Date & Time</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.preferred_date} at{' '}
                    {selectedBooking.preferred_time}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Location</Text>
                  <Text style={styles.modalValue}>
                    {selectedBooking.location_type === 'studio'
                      ? 'Studio Appointment'
                      : 'Mobile Service'}
                  </Text>
                  {selectedBooking.location_address && (
                    <Text style={styles.modalDescription}>
                      {selectedBooking.location_address}
                    </Text>
                  )}
                </View>

                {selectedBooking.notes && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalLabel}>Notes</Text>
                    <Text style={styles.modalDescription}>
                      {selectedBooking.notes}
                    </Text>
                  </View>
                )}

                {selectedBooking.status === 'pending' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.confirmButton]}
                      onPress={() =>
                        updateBookingStatus(selectedBooking.id, 'confirmed')
                      }
                    >
                      <Ionicons name="checkmark" size={20} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() =>
                        updateBookingStatus(selectedBooking.id, 'rejected')
                      }
                    >
                      <Ionicons name="close" size={20} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {selectedBooking.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() =>
                      updateBookingStatus(selectedBooking.id, 'completed')
                    }
                  >
                    <Ionicons name="checkmark-done" size={20} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Mark as Completed</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Gallery Upload Modal */}
      <Modal
        visible={showGalleryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGalleryModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload to Gallery</Text>
              <TouchableOpacity onPress={() => setShowGalleryModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bridal Hand Design"
                  value={galleryTitle}
                  onChangeText={setGalleryTitle}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Describe the design..."
                  value={galleryDescription}
                  onChangeText={setGalleryDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Bridal, Party, Floral"
                  value={galleryCategory}
                  onChangeText={setGalleryCategory}
                  placeholderTextColor="#999"
                />
              </View>

              <TouchableOpacity
                style={styles.selectImageButton}
                onPress={pickImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator color={COLORS.primary} />
                ) : (
                  <>
                    <Ionicons
                      name="image-outline"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.selectImageText}>
                      Select Image from Gallery
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  notifBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  notifBannerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statCardAlert: {
    backgroundColor: COLORS.lightBg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statNumberAlert: {
    color: COLORS.error,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: COLORS.lightBg,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#888',
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  listSection: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    color: '#888',
    marginTop: 12,
    fontSize: 16,
  },
  bookingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  bookingService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  bookingDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingDetailText: {
    fontSize: 13,
    color: '#888',
  },
  messageCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
  },
  messageCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  messageEmail: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  messageContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  messageDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 8,
  },
  gallerySection: {
    gap: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  uploadButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  galleryInfo: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBg,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  galleryInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  modalBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  modalValue: {
    fontSize: 16,
    color: COLORS.text,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    marginTop: 20,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
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
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBg,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    borderStyle: 'dashed',
    gap: 10,
    marginTop: 8,
  },
  selectImageText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  settingsSection: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  aboutTextArea: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
  availHint: {
    fontSize: 13,
    color: '#888',
    marginBottom: 16,
    lineHeight: 18,
  },
  availRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  availToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  availDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  availDotOn: {
    backgroundColor: COLORS.success,
  },
  availDotOff: {
    backgroundColor: '#ccc',
  },
  availDayName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  availDayNameOff: {
    color: '#999',
  },
  availTimes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availTimeInput: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    width: 65,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  availDash: {
    fontSize: 16,
    color: '#888',
  },
  availClosedText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  serviceEditCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  serviceEditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceEditName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  serviceEditPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginLeft: 12,
  },
  serviceEditDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceEditFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceEditMeta: {
    fontSize: 12,
    color: '#999',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loginCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  loginIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 6,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 24,
    textAlign: 'center',
  },
  loginErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    width: '100%',
  },
  loginErrorText: {
    fontSize: 14,
    color: COLORS.error,
  },
  loginInput: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    width: '100%',
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
