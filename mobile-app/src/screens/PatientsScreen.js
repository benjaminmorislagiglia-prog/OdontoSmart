import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { patientCoverage } from '../services/patientService';
import { usePatients, usePatientCatalogs } from '../hooks/useClinicQueries';
import { LoadingState, EmptyState, ErrorState } from '../components/FeedbackState';
import AppInput from '../components/AppInput';
import ScreenHeader from '../components/ScreenHeader';
import AppButton from '../components/AppButton';
import AnimatedPressable from '../components/AnimatedPressable';
import { useTheme } from '../context/ThemeContext';
export default function PatientsScreen({ navigation }) {
  const { styles } = useTheme();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(true);
  const patients = usePatients(active);
  const catalogs = usePatientCatalogs(!!patients.data?.length);
  const { data, isPending: loading, error } = patients;
  const retry = () => patients.refetch();
  const filtered = (data || []).filter((p) =>
    (p.name + ' ' + p.dni + ' ' + p.phone)
      .toLocaleLowerCase('es')
      .includes(query.trim().toLocaleLowerCase('es')),
  );
  return (
    <FlatList
      keyboardShouldPersistTaps="handled"
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={loading || error ? [] : filtered}
      refreshing={patients.isRefetching}
      onRefresh={retry}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View style={{ gap: 16 }}>
          <ScreenHeader title="Pacientes" subtitle="Información y seguimiento de cada paciente." />
          <AppButton title={active ? 'Ver pacientes inactivos' : 'Ver pacientes activos'} secondary onPress={() => setActive(value => !value)} />
          <Text style={styles.label}>{active ? 'Pacientes activos' : 'Pacientes inactivos'}</Text>
          <AppInput
            label="Buscar por nombre, DNI o teléfono"
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
          />
          {!!data?.length && catalogs.error && <ErrorState message={catalogs.error.message} onRetry={() => catalogs.refetch()} />}
        </View>
      }
      renderItem={({ item }) => (
        <AnimatedPressable
          accessibilityRole="button"
          onPress={() => navigation.navigate('PatientDetail', { id: item.id })}
          style={styles.card}
        >
          <Text style={styles.sectionTitle}>{item.name}</Text>
          <Text style={styles.body}>DNI: {item.dni}</Text>
          <Text style={styles.body}>{item.phone}</Text>
          <Text style={styles.muted}>{patientCoverage(item, catalogs.data)}</Text>
        </AnimatedPressable>
      )}
      ListEmptyComponent={
        loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error.message} onRetry={retry} />
        ) : (
          <EmptyState title={data?.length ? 'No se encontraron pacientes' : active ? 'No hay pacientes activos' : 'No hay pacientes inactivos'} message={data?.length ? 'Probá con otro nombre o DNI.' : 'No hay registros para mostrar.'} />
        )
      }
    />
  );
}
