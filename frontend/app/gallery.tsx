import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
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

// Placeholder images from the curated list
const placeholderImages = [
  'https://images.unsplash.com/photo-1623217509141-6f735087b50c',
  'https://images.pexels.com/photos/7176343/pexels-photo-7176343.jpeg',
  'https://images.pexels.com/photos/7802180/pexels-photo-7802180.jpeg',
  'https://images.unsplash.com/photo-1556614697-e4e00b2233f6',
  'https://images.unsplash.com/photo-1629332791128-58f00882964d',
];

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  image_base64: string;
  category?: string;
}

export default function GalleryScreen() {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [showPlaceholders, setShowPlaceholders] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/gallery`);
      const data = await response.json();
      setGallery(data);
      setShowPlaceholders(data.length === 0);
    } catch (error) {
      console.error('Error fetching gallery:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchGallery();
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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Design Gallery</Text>
          <Text style={styles.headerSubtitle}>
            Browse our collection of beautiful henna designs
          </Text>
        </View>

        {/* Gallery Grid */}
        {showPlaceholders ? (
          <View style={styles.galleryGrid}>
            <Text style={styles.placeholderNote}>
              Sample designs - Upload your own in Admin panel
            </Text>
            {placeholderImages.map((uri, index) => (
              <TouchableOpacity
                key={index}
                style={styles.galleryItem}
                onPress={() => setSelectedImage({
                  id: `placeholder-${index}`,
                  title: `Sample Design ${index + 1}`,
                  description: 'Beautiful henna design',
                  image_base64: uri,
                })}
              >
                <Image
                  source={{ uri: uri }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageTitle}>Sample Design {index + 1}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.galleryGrid}>
            {gallery.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.galleryItem}
                onPress={() => setSelectedImage(item)}
              >
                <Image
                  source={{ uri: item.image_base64 }}
                  style={styles.galleryImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay}>
                  <Text style={styles.imageTitle}>{item.title}</Text>
                  {item.category && (
                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Categories Info */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Design Categories</Text>
          <View style={styles.categoriesList}>
            <CategoryItem icon="hand-left-outline" title="Hand Designs" />
            <CategoryItem icon="heart-outline" title="Bridal" />
            <CategoryItem icon="flower-outline" title="Floral" />
            <CategoryItem icon="shapes-outline" title="Geometric" />
            <CategoryItem icon="sparkles-outline" title="Party" />
            <CategoryItem icon="color-palette-outline" title="Custom" />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="camera-outline" size={32} color={COLORS.primary} />
          <Text style={styles.infoTitle}>Share Your Design</Text>
          <Text style={styles.infoText}>
            After your appointment, share your henna photo with us to be featured in our gallery!
          </Text>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedImage(null)}
          >
            <Ionicons name="close-circle" size={36} color={COLORS.white} />
          </TouchableOpacity>
          {selectedImage && (
            <View style={styles.modalContent}>
              <Image
                source={{ uri: selectedImage.image_base64 }}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <View style={styles.modalInfo}>
                <Text style={styles.modalTitle}>{selectedImage.title}</Text>
                {selectedImage.description && (
                  <Text style={styles.modalDescription}>
                    {selectedImage.description}
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function CategoryItem({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.categoryItem}>
      <View style={styles.categoryIcon}>
        <Ionicons name={icon as any} size={24} color={COLORS.primary} />
      </View>
      <Text style={styles.categoryItemText}>{title}</Text>
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
  placeholderNote: {
    width: '100%',
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  galleryItem: {
    width: (width - 32) / 2,
    height: (width - 32) / 2,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.lightBg,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
  },
  imageTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTag: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  categoryText: {
    color: COLORS.white,
    fontSize: 11,
  },
  categoriesSection: {
    padding: 24,
    backgroundColor: COLORS.white,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryItem: {
    width: (width - 72) / 3,
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.lightBg,
    borderRadius: 12,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryItemText: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  infoSection: {
    padding: 32,
    margin: 16,
    backgroundColor: COLORS.lightBg,
    borderRadius: 16,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  modalContent: {
    width: width - 32,
    maxHeight: height - 150,
  },
  modalImage: {
    width: '100%',
    height: height * 0.6,
    borderRadius: 12,
  },
  modalInfo: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
