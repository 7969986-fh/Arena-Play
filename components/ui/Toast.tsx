import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeOutUp, Layout } from 'react-native-reanimated';
import { colors, radius, shadow } from '@/constants/theme';

export type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

interface ToastApi {
  show: (kind: ToastKind, title: string, body?: string) => void;
  success: (title: string, body?: string) => void;
  error: (title: string, body?: string) => void;
  info: (title: string, body?: string) => void;
}

const ToastContext = createContext<ToastApi | undefined>(undefined);

const STYLES: Record<ToastKind, { icon: keyof typeof Ionicons.glyphMap; tint: string; bg: string }> = {
  success: { icon: 'checkmark-circle', tint: '#0E9F6E', bg: '#E7F8F1' },
  error: { icon: 'alert-circle', tint: '#D64545', bg: '#FDECEC' },
  info: { icon: 'information-circle', tint: '#2B7FD4', bg: '#E8F2FC' },
};

/** How long each toast stays before dismissing itself. */
const LIFETIME_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (kind: ToastKind, title: string, body?: string) => {
      const id = nextId.current++;
      // Cap the stack so a burst of errors cannot cover the screen.
      setToasts((list) => [...list.slice(-2), { id, kind, title, body }]);
      setTimeout(() => dismiss(id), LIFETIME_MS);
    },
    [dismiss],
  );

  const api: ToastApi = {
    show,
    success: (t, b) => show('success', t, b),
    error: (t, b) => show('error', t, b),
    info: (t, b) => show('info', t, b),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View style={[styles.host, { top: insets.top + 8 }]} pointerEvents="box-none">
        {toasts.map((t) => {
          const s = STYLES[t.kind];
          return (
            <Animated.View
              key={t.id}
              entering={FadeInUp.springify().damping(18)}
              exiting={FadeOutUp.duration(180)}
              layout={Layout.springify()}
            >
              <Pressable
                onPress={() => dismiss(t.id)}
                style={[styles.toast, shadow.md, { backgroundColor: s.bg, borderColor: s.tint }]}
              >
                <Ionicons name={s.icon} size={21} color={s.tint} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { color: s.tint }]} numberOfLines={2}>
                    {t.title}
                  </Text>
                  {t.body ? (
                    <Text style={styles.body} numberOfLines={3}>
                      {t.body}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  title: { fontSize: 14, fontWeight: '800' },
  body: { fontSize: 12.5, color: colors.textMuted, fontWeight: '600', marginTop: 2, lineHeight: 17 },
});
