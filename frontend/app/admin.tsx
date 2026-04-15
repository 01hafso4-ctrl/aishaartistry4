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
  primary: '#8B4513',
  secondary: '#D4A574',
  accent: '#C9A96E',
  background: '#FFF8F0',
  text: '#3D2914',
  white: '#FFFFFF',
  lightBg: '#FDF5ED',
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

type Tab = 'bookings' | 'messages' | 'gallery';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, contactsRes, settingsRes] = await Promise.all([
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/bookings`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/contacts`),
        fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/settings`),
      ]);
      const bookingsData = await bookingsRes.json();
      const contactsData = await contactsRes.json();
      const settingsData = await settingsRes.json();
      setBookings(bookingsData);
      setContacts(contactsData);
      setSettingsBusinessName(settingsData.business_name || '');
      setSettingsTagline(settingsData.tagline || '');
      setSettingsAbout(settingsData.about_text || '');
      setSettingsPhone(settingsData.phone || '');
      setSettingsEmail(settingsData.email || '');
      setSettingsInstagram(settingsData.instagram || '');
      setSettingsAddress(settingsData.studio_address || '');
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

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Stats Cards */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{unreadMessages}</Text>
          <Text style={styles.statLabel}>Unread Messages</Text>
        </View>
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
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
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
});
