import { Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
export default function AppInput({ label, ...props }) {
 const { colors, styles } = useTheme();
 return <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} {...props} style={{ minHeight: 48, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, fontSize: 16, color: colors.text, backgroundColor: colors.surface }} /></View>;
}
