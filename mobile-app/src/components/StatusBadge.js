import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
const icons = { Pendiente: 'time-outline', Confirmado: 'checkmark-circle-outline', Cancelado: 'close-circle-outline', Atendido: 'checkmark-done-outline' };
export default function StatusBadge({ status }) {
 const { colors, styles } = useTheme();
 return <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', alignSelf: 'flex-start', padding: 8, borderRadius: 8, backgroundColor: colors.soft }}><Ionicons name={icons[status] || 'information-circle-outline'} color={status === 'Cancelado' ? colors.danger : colors.primary} size={18} /><Text style={[styles.label, { color: status === 'Cancelado' ? colors.danger : colors.primary }]}>{status}</Text></View>;
}
