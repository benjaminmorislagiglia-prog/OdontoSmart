import { ActivityIndicator, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppButton from './AppButton';
export function LoadingState({ message = 'Cargando…' }) {
  const { colors, styles } = useTheme();
  return <View style={[styles.card, { alignItems: 'center', margin: 20 }]} accessibilityLiveRegion="polite"><ActivityIndicator color={colors.primary} /><Text style={styles.muted}>{message}</Text></View>;
}
export function EmptyState({ title = 'No hay información disponible', message = '' }) {
  const { styles } = useTheme();
  return <View style={styles.card}><Text style={styles.label}>{title}</Text>{message && <Text style={styles.muted}>{message}</Text>}</View>;
}
export function ErrorState({ message, onRetry }) {
  const { styles } = useTheme();
  return <View style={[styles.card, { margin: 20 }]} accessibilityLiveRegion="assertive"><Text style={styles.error}>{message}</Text>{onRetry && <AppButton title="Reintentar" onPress={onRetry} secondary />}</View>;
}
