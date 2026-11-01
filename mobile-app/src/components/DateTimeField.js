import { useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatters';
import { timeKey } from '../utils/dates';
import AppButton from './AppButton';

/** @param {{label: string, mode: 'date' | 'time', value: Date | null, onChange: (date: Date) => void, disabled?: boolean}} props */
export default function DateTimeField({ label, mode, value, onChange, disabled = false }) {
  const { colors, styles, mode: themeMode } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());
  const [error, setError] = useState('');
  function show() {
    setError('');
    const initial = value || new Date();
    if (Platform.OS === 'android') {
      try {
        DateTimePickerAndroid.open({ value: initial, mode, is24Hour: true,
          positiveButton: { label: 'Aceptar' }, negativeButton: { label: 'Cancelar' },
          onValueChange: (_event, selected) => onChange(selected),
          onError: () => setError('No se pudo abrir el selector. Intentá nuevamente.'),
        });
      } catch { setError('No se pudo abrir el selector. Intentá nuevamente.'); }
    } else {
      setDraft(initial);
      setOpen(true);
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <AppButton title={value ? mode === 'date' ? formatDate(value) : timeKey(value).slice(0, 5) : `Seleccionar ${label.toLocaleLowerCase('es')}`} secondary disabled={disabled} onPress={show} />
      {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      {Platform.OS === 'ios' && <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0009', padding: 20 }}>
          <View style={styles.card} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Seleccionar {label.toLocaleLowerCase('es')}</Text>
            {open && <DateTimePicker value={draft} mode={mode} display="spinner" themeVariant={themeMode} textColor={colors.text} is24Hour onValueChange={(_event, selected) => setDraft(selected)} />}
            <AppButton title="Aceptar" onPress={() => { onChange(draft); setOpen(false); }} />
            <AppButton title="Cancelar" secondary onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>}
    </View>
  );
}
