import { useState } from 'react';
import { FlatList, Modal, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import AppButton from './AppButton';

export default function SelectionField({ label, options, value, onChange, disabled = false }) {
  const { styles } = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.id === value);
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <AppButton title={selected?.label || `Seleccionar ${label.toLocaleLowerCase('es')}`} secondary disabled={disabled || !options.length} onPress={() => setOpen(true)} />
      {selected?.description && <Text style={styles.muted}>{selected.description}</Text>}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0009', padding: 20 }}>
          <View style={[styles.card, { maxHeight: '85%' }]} accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Seleccionar {label.toLocaleLowerCase('es')}</Text>
            <FlatList data={options} keyExtractor={item => item.id} contentContainerStyle={{ gap: 12 }}
              renderItem={({ item }) => <View style={{ gap: 4 }}>
                <AppButton title={(item.id === value ? '✓ ' : '') + item.label} secondary={item.id !== value} onPress={() => { onChange(item.id); setOpen(false); }} />
                {item.description && <Text style={styles.muted}>{item.description}</Text>}
              </View>} />
            <AppButton title="Cancelar" secondary onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
