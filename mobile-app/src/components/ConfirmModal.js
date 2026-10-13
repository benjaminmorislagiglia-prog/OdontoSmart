import { Modal, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppButton from './AppButton';
export default function ConfirmModal({ visible, title, message, onConfirm, onClose, busy = false, error = '' }) {
 const { styles } = useTheme();
 return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { if (!busy) onClose(); }}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 24 }}><ScrollView contentContainerStyle={[styles.card, { width: '100%', maxWidth: 480, alignSelf: 'center' }]} style={{ flexGrow: 0 }} accessibilityViewIsModal><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{message}</Text>{error ? <Text style={styles.error} accessibilityLiveRegion="assertive">{error}</Text> : null}<AppButton title="Confirmar" onPress={onConfirm} loading={busy} /><AppButton title="Volver" onPress={onClose} disabled={busy} secondary /></ScrollView></View></Modal>;
}
