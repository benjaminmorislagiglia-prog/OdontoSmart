import { Pressable, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';
export default function AppointmentCard({ appointment, onPress = undefined }) {
 const { colors, styles } = useTheme();
 return <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.7 : 1 }]}><Text style={[styles.label, { color: colors.primary }]}>{formatDate(appointment.date)} · {appointment.time}</Text><Text style={styles.sectionTitle}>{appointment.patient}</Text><Text style={styles.body}>{appointment.treatment}</Text><Text style={styles.muted}>{appointment.dentist} · Consultorio {appointment.room}</Text><StatusBadge status={appointment.status} /></Pressable>;
}
