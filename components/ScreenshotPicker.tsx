import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/theme';

interface Props {
  /** Currently chosen local image URI, or null when nothing is picked yet. */
  value: string | null;
  onChange: (uri: string | null) => void;
  label?: string;
  hint?: string;
}

/**
 * Dashed drop-zone that opens the gallery and previews the chosen screenshot.
 * Used for both UPI payment proof and match result proof.
 */
export default function ScreenshotPicker({ value, onChange, label = 'Upload screenshot', hint }: Props) {
  const [busy, setBusy] = useState(false);

  async function pick() {
    setBusy(true);
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          'Allow photo access so you can attach a screenshot.',
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.6,
      });
      if (!res.canceled && res.assets[0]) onChange(res.assets[0].uri);
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <View>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={styles.preview}>
          <Image source={{ uri: value }} style={styles.img} resizeMode="cover" />
          <Pressable style={styles.remove} onPress={() => onChange(null)} hitSlop={8}>
            <Ionicons name="close" size={16} color="#fff" />
          </Pressable>
        </View>
        <Pressable onPress={pick}>
          <Text style={styles.change}>Choose a different image</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable style={styles.zone} onPress={pick} disabled={busy}>
        <Ionicons name="cloud-upload-outline" size={30} color={colors.primary} />
        <Text style={styles.zoneTxt}>{busy ? 'Opening…' : 'Tap to attach a screenshot'}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '800', color: colors.text, marginBottom: 8 },
  zone: {
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: 26,
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.mint,
  },
  zoneTxt: { fontSize: 13, fontWeight: '700', color: colors.primaryDark },
  hint: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textAlign: 'center', paddingHorizontal: 16 },
  preview: { borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.mint },
  img: { width: '100%', height: 190 },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: {
    marginTop: 8,
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
});
