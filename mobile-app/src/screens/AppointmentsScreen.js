import { useCallback, useState } from 'react';
import { FlatList, ScrollView, Text, View, Pressable } from 'react-native';
import { appointmentService, appointmentStates } from '../services/appointmentService';
import useResource from '../hooks/useResource';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppointmentCard from '../components/AppointmentCard';
import AppButton from '../components/AppButton';
import AppInput from '../components/AppInput';
import ScreenHeader from '../components/ScreenHeader';
import { useTheme } from '../context/ThemeContext';
import { formatDate } from '../utils/formatters';
import { dateKey, shiftDay } from '../utils/dates';
export default function AppointmentsScreen({ navigation }) {
  const { colors, styles } = useTheme();
  const [day, setDay] = useState(dateKey());
  const [status, setStatus] = useState('Todos');
  const [query, setQuery] = useState('');
  const loader = useCallback(() => appointmentService.listByDate(day), [day]);
  const { data, loading, error, retry } = useResource(loader);
  const filtered = (data || []).filter(
    (a) =>
      a.date === day &&
      (status === 'Todos' || a.status === status) &&
      (a.patient + ' ' + a.dentist)
        .toLocaleLowerCase('es')
        .includes(query.trim().toLocaleLowerCase('es')),
  );
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={loading || error ? [] : filtered}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <ScreenHeader title="Turnos" subtitle={formatDate(day)} />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <AppButton title="Día anterior" secondary onPress={() => setDay(shiftDay(day, -1))} />
            <AppButton title="Hoy" secondary onPress={() => setDay(dateKey())} />
            <AppButton title="Día siguiente" secondary onPress={() => setDay(shiftDay(day, 1))} />
          </View>
          <AppInput
            label="Buscar paciente u odontólogo"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {['Todos', ...appointmentStates].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityState={{ selected: status === value }}
                onPress={() => setStatus(value)}
                style={{
                  padding: 14,
                  minHeight: 48,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: status === value ? colors.primary : colors.border,
                  backgroundColor: status === value ? colors.soft : colors.surface,
                }}
              >
                <Text style={styles.label}>{value}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      }
      renderItem={({ item }) => (
        <AppointmentCard
          appointment={item}
          onPress={() => navigation.navigate('AppointmentDetail', { id: item.id })}
        />
      )}
      ListEmptyComponent={
        loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : (
          <EmptyState
            title="No hay turnos para mostrar"
            message="Probá otra fecha o ajustá los filtros."
          />
        )
      }
    />
  );
}
