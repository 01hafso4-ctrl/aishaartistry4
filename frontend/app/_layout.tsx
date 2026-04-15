import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const { width } = Dimensions.get('window');
const isWide = width > 768;

const COLORS = {
  primary: '#D4688A',
  secondary: '#F5C6D0',
  accent: '#E8A0B5',
  background: '#FFF5F8',
  text: '#3A1F2E',
  white: '#FFFFFF',
  lightBg: '#FFF0F5',
};

function WebNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: 'Home', path: '/', icon: 'home-outline' },
    { label: 'Services', path: '/services', icon: 'sparkles-outline' },
    { label: 'Gallery', path: '/gallery', icon: 'images-outline' },
    { label: 'Book Now', path: '/book', icon: 'calendar-outline' },
    { label: 'Contact', path: '/contact', icon: 'mail-outline' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.navContainer}>
      <View style={styles.navInner}>
        <TouchableOpacity onPress={() => router.push('/')} style={styles.logoContainer}>
          <Ionicons name="leaf" size={24} color={COLORS.accent} />
          <Text style={styles.logoText}>Aishartistry</Text>
        </TouchableOpacity>

        {isWide ? (
          <View style={styles.navLinks}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.path}
                style={[styles.navLink, isActive(item.path) && styles.navLinkActive]}
                onPress={() => router.push(item.path as any)}
              >
                <Text style={[styles.navLinkText, isActive(item.path) && styles.navLinkTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity onPress={() => setMenuOpen(!menuOpen)} style={styles.hamburger}>
            <Ionicons name={menuOpen ? 'close' : 'menu'} size={28} color={COLORS.white} />
          </TouchableOpacity>
        )}
      </View>

      {!isWide && menuOpen && (
        <View style={styles.mobileMenu}>
          {navItems.map((item) => (
            <TouchableOpacity
              key={item.path}
              style={[styles.mobileMenuItem, isActive(item.path) && styles.mobileMenuItemActive]}
              onPress={() => {
                router.push(item.path as any);
                setMenuOpen(false);
              }}
            >
              <Ionicons name={item.icon as any} size={20} color={isActive(item.path) ? COLORS.accent : COLORS.white} />
              <Text style={[styles.mobileMenuText, isActive(item.path) && styles.mobileMenuTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <WebNavBar />
      <Tabs
        screenOptions={{
          tabBarStyle: { display: 'none' },
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="services" />
        <Tabs.Screen name="gallery" />
        <Tabs.Screen name="book" />
        <Tabs.Screen name="contact" />
        <Tabs.Screen name="admin" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    backgroundColor: COLORS.primary,
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 0, zIndex: 1000 } : {}),
  },
  navInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLink: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  navLinkActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  navLinkText: {
    fontSize: 15,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  navLinkTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  hamburger: {
    padding: 4,
  },
  mobileMenu: {
    backgroundColor: COLORS.primary,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  mobileMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  mobileMenuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  mobileMenuText: {
    fontSize: 16,
    color: COLORS.secondary,
  },
  mobileMenuTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
});
