import { StyleSheet } from 'react-native';
export const colors = { primary: '#14685c', background: '#f5f7f8', surface: '#fff', text: '#243a41', muted: '#596f78', border: '#dfe7e8', soft: '#e8f3ee', danger: '#a34740' };
export const darkColors = { primary: '#78d6bd', background: '#111e23', surface: '#1b2d34', text: '#edf6f7', muted: '#b3c7ce', border: '#3b535d', soft: '#23463e', danger: '#ffaaa1' };
export const createThemeStyles = (colors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { fontSize: 25, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 8 },
  card: { padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text, lineHeight: 22 },
  muted: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  error: { fontSize: 14, color: colors.danger, lineHeight: 21 },
});
export const styles = createThemeStyles(colors);
