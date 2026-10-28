import { useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { profile } from '../mocks/profile';
import AppButton from '../components/AppButton';
import ScreenHeader from '../components/ScreenHeader';
export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, styles, mode, error, changeMode } = useTheme();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  async function closeSession() {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      await logout();
    } catch {
      setMessage('No se pudo cerrar la sesión. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  }
  async function toggle(value) {
    setSaving(true);
    await changeMode(value ? 'dark' : 'light');
    setSaving(false);
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Perfil" subtitle="Tu sesión y preferencias visuales." />
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{profile.name}</Text>
        <Text style={styles.body}>Usuario: {user.username}</Text>
        <Text style={styles.muted}>{profile.position}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Text style={styles.body}>Tema oscuro</Text>
          <Switch
            accessibilityLabel="Tema oscuro"
            disabled={saving}
            value={mode === 'dark'}
            onValueChange={toggle}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text style={styles.muted}>La preferencia se guarda en este dispositivo.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      {message ? (
        <Text style={styles.error} accessibilityLiveRegion="assertive">
          {message}
        </Text>
      ) : null}
      <AppButton
        title="Cerrar sesión"
        loadingText="Cerrando sesión…"
        loading={busy}
        onPress={closeSession}
      />
    </ScrollView>
  );
}
