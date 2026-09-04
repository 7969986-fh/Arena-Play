import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import { colors, spacing } from '@/constants/theme';

export interface Section {
  heading?: string;
  body: string;
}

export default function InfoPage({ title, sections }: { title: string; sections: Section[] }) {
  return (
    <View style={styles.bg}>
      <Header title={title} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {sections.map((s, i) => (
          <Card key={i} style={{ marginBottom: 12 }}>
            {s.heading ? <Text style={styles.heading}>{s.heading}</Text> : null}
            <Text style={styles.body}>{s.body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: colors.bg },
  heading: { fontSize: 15, fontWeight: '900', color: colors.text, marginBottom: 6 },
  body: { fontSize: 14, color: colors.textMuted, lineHeight: 21, fontWeight: '500' },
});
