import { Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
export default function ScreenHeader({ title, subtitle = '' }) {
 const { styles } = useTheme();
 return <View style={{ gap: 6 }}><Text accessibilityRole="header" style={styles.title}>{title}</Text>{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}</View>;
}
