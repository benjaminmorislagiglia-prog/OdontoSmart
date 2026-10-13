import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { notificationService } from '../services/notificationService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppButton from '../components/AppButton';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
export default function NotificationsScreen() {
 const { colors, styles } = useTheme();
 const { data, loading, error, retry } = useResource(notificationService.list);
 const [busy, setBusy] = useState('');
 const [message, setMessage] = useState('');
 async function read(id) {
  if (busy) return;
  setBusy(id); setMessage('');
  try { await notificationService.markRead(id); retry(); }
  catch { setMessage('No se pudo marcar el aviso como leído. Intentá nuevamente.'); }
  finally { setBusy(''); }
 }
 if (loading) return <LoadingState />;
 if (error) return <ErrorState message={error} onRetry={retry} />;
 return <FlatList style={styles.screen} contentContainerStyle={styles.content} data={data} keyExtractor={item => item.id} ListHeaderComponent={<View style={{ gap: 12 }}><ScreenHeader title="Notificaciones" subtitle={data.filter(n => !n.read).length + ' avisos sin leer'} />{message ? <Text style={styles.error} accessibilityLiveRegion="assertive">{message}</Text> : null}</View>} renderItem={({ item }) => <View style={styles.card}><Ionicons name={item.icon} color={colors.primary} size={24} /><Text style={styles.label}>{item.read ? 'Leído' : 'No leído'}</Text><Text style={styles.sectionTitle}>{item.title}</Text><Text style={styles.body}>{item.message}</Text>{!item.read && <AppButton title="Marcar como leído" secondary disabled={!!busy} onPress={() => read(item.id)} />}</View>} ListEmptyComponent={<EmptyState title="No hay avisos internos" />} />;
}
