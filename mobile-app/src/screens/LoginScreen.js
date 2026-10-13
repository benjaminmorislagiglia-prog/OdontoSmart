import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import AppButton from '../components/AppButton';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen() {
  const { colors, styles } = useTheme();
  const s = makeStyles(colors);
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const userRef = useRef(null);
  const passwordRef = useRef(null);
  async function submit() {
    if (loading) return;
    const validation = { username: '', password: '' };
    if (!username.trim()) validation.username = 'Ingresá tu usuario.';
    if (!password) validation.password = 'Ingresá tu contraseña.';
    setErrors(validation); setMessage('');
    if (validation.username || validation.password) { (validation.username ? userRef : passwordRef).current?.focus(); return; }
    setLoading(true);
    try { await login(username.trim(), password); }
    catch (error) { setMessage(error.message || 'No se pudo iniciar sesión.'); }
    finally { setLoading(false); }
  }
  return <SafeAreaView style={styles.screen}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, s.form]}>
          <View style={s.brand}><Ionicons name="medical-outline" size={30} color={colors.primary} /><Text style={styles.title}>OdontoSmart</Text></View>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Gestión de tu clínica, estés donde estés.</Text>
          <Text style={styles.muted}>Ambos campos son obligatorios.</Text>
          <Text nativeID="username-label" style={styles.label}>Usuario</Text>
          <TextInput ref={userRef} style={[s.input, errors.username && s.invalid]} accessibilityLabel="Usuario" accessibilityLabelledBy="username-label" autoCapitalize="none" autoCorrect={false} autoComplete="username" editable={!loading} value={username} onChangeText={setUsername} returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} />
          {errors.username && <Text style={styles.error} accessibilityLiveRegion="polite">{errors.username}</Text>}
          <Text nativeID="password-label" style={styles.label}>Contraseña</Text>
          <View style={s.passwordRow}>
            <TextInput ref={passwordRef} style={[s.input, { flex: 1 }, errors.password && s.invalid]} accessibilityLabel="Contraseña" accessibilityLabelledBy="password-label" secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} autoComplete="current-password" editable={!loading} value={password} onChangeText={setPassword} returnKeyType="go" onSubmitEditing={submit} />
            <Pressable style={s.eye} disabled={loading} accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onPress={() => setVisible(value => !value)}><Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={24} color={colors.primary} /></Pressable>
          </View>
          {errors.password && <Text style={styles.error} accessibilityLiveRegion="polite">{errors.password}</Text>}
          {message ? <Text style={styles.error} accessibilityLiveRegion="assertive">{message}</Text> : null}
          <AppButton title="Iniciar sesión" onPress={submit} loading={loading} loadingText="Ingresando…" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const makeStyles = (colors) => StyleSheet.create({ container: { flexGrow: 1, justifyContent: 'center', padding: 20 }, form: { gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24 }, brand: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 18 }, input: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, color: colors.text, borderRadius: 9, minHeight: 48, paddingHorizontal: 12, fontSize: 16 }, invalid: { borderColor: colors.danger }, passwordRow: { flexDirection: 'row', gap: 8 }, eye: { width: 48, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.soft, borderRadius: 9 } });
