import { ActivityIndicator, Pressable, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
export default function AppButton({ title, onPress, loading = false, disabled = false, secondary = false, loadingText = 'Procesando…' }) {
 const { colors } = useTheme();
 return <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading, busy: loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => ({ minHeight: 48, borderRadius: 10, padding: 14, gap: 10, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: secondary ? colors.soft : colors.primary, opacity: pressed || disabled || loading ? 0.65 : 1 })}>
 {loading && <ActivityIndicator color={secondary ? colors.primary : colors.background} />}
 <Text style={{ color: secondary ? colors.primary : colors.background, fontSize: 15, fontWeight: '600', textAlign: 'center' }}>{loading ? loadingText : title}</Text></Pressable>;
}
