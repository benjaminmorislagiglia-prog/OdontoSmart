import { Text } from 'react-native';
import AnimatedPressable from './AnimatedPressable';
import { useTheme } from '../context/ThemeContext';
import StatusBadge from './StatusBadge';
import { formatDate } from '../utils/formatters';
export default function AppointmentCard({ appointment, onPress = undefined }) {
 const { colors, styles } = useTheme();
 return <AnimatedPressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} style={styles.card}><Text style={[styles.label, { color: colors.primary }]}>{formatDate(appointment.date)} · {appointment.time}</Text><Text style={styles.sectionTitle}>{appointment.patient}</Text><Text style={styles.muted}>{appointment.dentist} · {appointment.room}</Text><StatusBadge status={appointment.status} /></AnimatedPressable>;
}
